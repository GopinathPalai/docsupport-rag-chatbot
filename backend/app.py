import os
import sys
import logging
from pathlib import Path
from flask import Flask, request, jsonify
from flask_cors import CORS
from werkzeug.utils import secure_filename

# Add backend directory to sys.path
BASE_DIR = Path(__file__).resolve().parent
sys.path.insert(0, str(BASE_DIR))

from config import (
    DATA_DIR, DOCUMENTS_DIR, SAMPLE_DOCS_DIR, VECTOR_STORE_FILE,
    TICKETS_FILE, UNANSWERED_FILE, GEMINI_API_KEY, DEFAULT_MODEL,
    EMBEDDING_MODEL, CHUNK_SIZE, CHUNK_OVERLAP, TOP_K_RETRIEVAL,
    SIMILARITY_THRESHOLD, FALLBACK_RESPONSE
)
from services.document_processor import DocumentProcessor
from services.vector_store import VectorStore
from services.ticket_service import TicketService
from services.analytics_service import AnalyticsService
from services.rag_engine import RAGEngine
from seed_data import seed_sample_documents

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("DocuSupportAI")

FRONTEND_DIST = BASE_DIR.parent / "frontend" / "dist"

# Initialize Flask app
if FRONTEND_DIST.exists():
    app = Flask(__name__, static_folder=str(FRONTEND_DIST), static_url_path="")
else:
    app = Flask(__name__)

CORS(app, resources={r"/api/*": {"origins": "*"}})

# Global runtime services
doc_processor = DocumentProcessor(chunk_size=CHUNK_SIZE, chunk_overlap=CHUNK_OVERLAP)
vector_store = VectorStore(storage_path=VECTOR_STORE_FILE, api_key=GEMINI_API_KEY, embedding_model=EMBEDDING_MODEL)
ticket_service = TicketService(storage_path=TICKETS_FILE)
analytics_service = AnalyticsService(storage_path=UNANSWERED_FILE)
rag_engine = RAGEngine(
    vector_store=vector_store,
    analytics_service=analytics_service,
    api_key=GEMINI_API_KEY,
    model_name=DEFAULT_MODEL,
    similarity_threshold=SIMILARITY_THRESHOLD,
    top_k=TOP_K_RETRIEVAL
)

# Seed sample docs if empty
if len(vector_store.documents) == 0:
    logger.info("Initializing knowledge base with sample company documents...")
    seed_sample_documents(vector_store, doc_processor)

# ----------------- SYSTEM & CONFIG ROUTES ----------------- #

@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "online",
        "service": "DocuSupport RAG Customer Support API",
        "version": "1.0.0",
        "gemini_active": bool(rag_engine.client is not None),
        "total_documents": len(vector_store.documents),
        "total_chunks": len(vector_store.chunks),
        "timestamp": analytics_service.metrics.get("timestamp")
    })

@app.route("/api/config", methods=["GET"])
def get_config():
    return jsonify({
        "has_gemini_key": bool(rag_engine.api_key),
        "masked_api_key": f"{rag_engine.api_key[:6]}...{rag_engine.api_key[-4:]}" if len(rag_engine.api_key) > 10 else ("Configured" if rag_engine.api_key else ""),
        "model_name": rag_engine.model_name,
        "embedding_model": vector_store.embedding_model,
        "similarity_threshold": rag_engine.similarity_threshold,
        "top_k": rag_engine.top_k,
        "chunk_size": doc_processor.chunk_size,
        "chunk_overlap": doc_processor.chunk_overlap
    })

@app.route("/api/config", methods=["POST"])
def update_config():
    data = request.json or {}
    new_key = data.get("api_key")
    if new_key is not None:
        rag_engine.set_api_key(new_key.strip())
        logger.info("Updated Gemini API key.")

    if "model_name" in data:
        rag_engine.model_name = data["model_name"]
    if "similarity_threshold" in data:
        try:
            rag_engine.similarity_threshold = float(data["similarity_threshold"])
        except ValueError:
            pass
    if "top_k" in data:
        try:
            rag_engine.top_k = int(data["top_k"])
        except ValueError:
            pass

    return jsonify({
        "success": True,
        "message": "Configuration updated successfully",
        "has_gemini_key": bool(rag_engine.api_key),
        "model_name": rag_engine.model_name,
        "similarity_threshold": rag_engine.similarity_threshold,
        "top_k": rag_engine.top_k
    })

# ----------------- CHAT & RAG ROUTES ----------------- #

@app.route("/api/chat", methods=["POST"])
def chat():
    data = request.json or {}
    query = data.get("message", "").strip()
    session_id = data.get("session_id", "default")

    if not query:
        return jsonify({"error": "Message cannot be empty"}), 400

    try:
        response = rag_engine.answer_query(query=query, session_id=session_id)
        return jsonify(response)
    except Exception as e:
        logger.error(f"Chat processing failed: {e}", exc_info=True)
        return jsonify({
            "error": "Failed to process chat query",
            "details": str(e),
            "answer": FALLBACK_RESPONSE,
            "citations": [],
            "confidence_score": 0.0,
            "is_fallback": True,
            "suggest_handoff": True
        }), 500

@app.route("/api/chat/sessions/<session_id>", methods=["GET"])
def get_session(session_id):
    history = rag_engine.get_session_history(session_id)
    return jsonify({"session_id": session_id, "history": history})

@app.route("/api/chat/sessions/<session_id>", methods=["DELETE"])
def clear_session(session_id):
    rag_engine.clear_session(session_id)
    return jsonify({"success": True, "message": f"Session {session_id} cleared"})

# ----------------- KNOWLEDGE BASE & DOCUMENTS ----------------- #

@app.route("/api/documents", methods=["GET"])
def list_documents():
    docs = vector_store.list_documents()
    stats = vector_store.get_stats()
    return jsonify({"documents": docs, "stats": stats})

@app.route("/api/documents/upload", methods=["POST"])
def upload_document():
    if "file" not in request.files:
        return jsonify({"error": "No file uploaded"}), 400

    file = request.files["file"]
    if file.filename == "":
        return jsonify({"error": "Filename is empty"}), 400

    filename = secure_filename(file.filename)
    allowed_extensions = {".pdf", ".txt", ".md", ".markdown"}
    ext = Path(filename).suffix.lower()

    if ext not in allowed_extensions:
        return jsonify({"error": f"Unsupported file type '{ext}'. Supported: PDF, TXT, MD"}), 400

    save_path = DOCUMENTS_DIR / filename
    file.save(str(save_path))

    try:
        doc_data = doc_processor.process_file(str(save_path), doc_name=Path(filename).stem.replace("_", " "))
        saved_doc = vector_store.add_document(doc_data)
        return jsonify({
            "success": True,
            "message": f"Successfully indexed '{filename}' with {saved_doc['chunk_count']} chunks.",
            "document": saved_doc
        })
    except Exception as e:
        logger.error(f"Error processing uploaded file: {e}")
        return jsonify({"error": f"Failed to parse and index document: {str(e)}"}), 500

@app.route("/api/documents/scrape", methods=["POST"])
def scrape_url():
    data = request.json or {}
    url = data.get("url", "").strip()

    if not url or not (url.startswith("http://") or url.startswith("https://")):
        return jsonify({"error": "Valid http/https URL is required"}), 400

    try:
        doc_data = doc_processor.process_url(url)
        saved_doc = vector_store.add_document(doc_data)
        return jsonify({
            "success": True,
            "message": f"Successfully scraped and indexed '{saved_doc['doc_name']}' with {saved_doc['chunk_count']} chunks.",
            "document": saved_doc
        })
    except Exception as e:
        logger.error(f"Error scraping URL {url}: {e}")
        return jsonify({"error": f"Failed to scrape webpage: {str(e)}"}), 500

@app.route("/api/documents/text", methods=["POST"])
def add_raw_text():
    data = request.json or {}
    title = data.get("title", "").strip()
    text = data.get("text", "").strip()

    if not title or not text:
        return jsonify({"error": "Title and text content are required"}), 400

    try:
        doc_data = doc_processor.process_raw_text(text, title)
        saved_doc = vector_store.add_document(doc_data)
        return jsonify({
            "success": True,
            "message": f"Successfully indexed '{title}' with {saved_doc['chunk_count']} chunks.",
            "document": saved_doc
        })
    except Exception as e:
        logger.error(f"Error indexing text entry: {e}")
        return jsonify({"error": f"Failed to index text: {str(e)}"}), 500

@app.route("/api/documents/<doc_id>", methods=["DELETE"])
def delete_document(doc_id):
    success = vector_store.delete_document(doc_id)
    if success:
        return jsonify({"success": True, "message": f"Document {doc_id} deleted successfully"})
    return jsonify({"error": "Document not found"}), 404

@app.route("/api/documents/<doc_id>/chunks", methods=["GET"])
def get_chunks(doc_id):
    chunks = vector_store.get_document_chunks(doc_id)
    return jsonify({"doc_id": doc_id, "total_chunks": len(chunks), "chunks": chunks})

# ----------------- TICKETS & HUMAN HANDOFF ----------------- #

@app.route("/api/tickets", methods=["GET"])
def list_tickets():
    status = request.args.get("status")
    priority = request.args.get("priority")
    tickets = ticket_service.list_tickets(status=status, priority=priority)
    stats = ticket_service.get_stats()
    return jsonify({"tickets": tickets, "stats": stats})

@app.route("/api/tickets", methods=["POST"])
def create_ticket():
    data = request.json or {}
    if not data.get("customer_email"):
        return jsonify({"error": "Customer email is required"}), 400

    # Auto attach conversation history if session_id provided
    session_id = data.get("session_id")
    if session_id and not data.get("conversation_history"):
        data["conversation_history"] = rag_engine.get_session_history(session_id)

    ticket = ticket_service.create_ticket(data)
    analytics_service.metrics["escalated_queries"] += 1
    analytics_service.save()

    return jsonify({
        "success": True,
        "message": f"Escalation ticket {ticket['ticket_id']} created successfully.",
        "ticket": ticket
    }), 201

@app.route("/api/tickets/<ticket_id>", methods=["PATCH"])
def update_ticket(ticket_id):
    data = request.json or {}
    updated = ticket_service.update_ticket(ticket_id, data)
    if updated:
        return jsonify({"success": True, "ticket": updated})
    return jsonify({"error": "Ticket not found"}), 404

@app.route("/api/tickets/<ticket_id>", methods=["DELETE"])
def delete_ticket(ticket_id):
    success = ticket_service.delete_ticket(ticket_id)
    if success:
        return jsonify({"success": True, "message": "Ticket deleted"})
    return jsonify({"error": "Ticket not found"}), 404

# ----------------- ADMIN DASHBOARD & ANALYTICS ----------------- #

@app.route("/api/admin/unanswered", methods=["GET"])
def list_unanswered():
    status = request.args.get("status")
    items = analytics_service.list_unanswered(status=status)
    return jsonify({"unanswered": items})

@app.route("/api/admin/unanswered/<item_id>/resolve", methods=["POST"])
def resolve_unanswered(item_id):
    data = request.json or {}
    action = data.get("action", "resolved_kb")
    success = analytics_service.resolve_unanswered(item_id, action)
    if success:
        return jsonify({"success": True, "message": "Marked resolved"})
    return jsonify({"error": "Item not found"}), 404

@app.route("/api/admin/analytics", methods=["GET"])
def get_analytics():
    stats = analytics_service.get_analytics()
    kb_stats = vector_store.get_stats()
    ticket_stats = ticket_service.get_stats()
    return jsonify({
        "telemetry": stats,
        "knowledge_base": kb_stats,
        "tickets": ticket_stats
    })

@app.route("/api/admin/seed", methods=["POST"])
def reset_seed():
    seed_sample_documents(vector_store, doc_processor, force=True)
    return jsonify({
        "success": True,
        "message": "Sample documents re-seeded into Knowledge Base.",
        "stats": vector_store.get_stats()
    })

@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
def serve_frontend(path):
    if FRONTEND_DIST.exists():
        if path != "" and (FRONTEND_DIST / path).exists():
            return app.send_static_file(path)
        return app.send_static_file("index.html")
    return jsonify({
        "status": "online",
        "service": "DocuSupport RAG Customer Support API",
        "message": "Frontend not built yet. Run 'npm run build' in frontend/ or visit http://localhost:3000 for dev server."
    })

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    print("\n=======================================================")
    print(f"[*] DocuSupport RAG Customer Support Server running on http://127.0.0.1:{port}")
    print("=======================================================\n")
    app.run(host="0.0.0.0", port=port, debug=False)
