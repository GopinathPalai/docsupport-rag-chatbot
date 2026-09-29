import os
import sys
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent))

from config import SAMPLE_DOCS_DIR, VECTOR_STORE_FILE
from services.document_processor import DocumentProcessor
from services.vector_store import VectorStore

def seed_sample_documents(vector_store: VectorStore, doc_processor: DocumentProcessor, force: bool = False):
    """Indexes all sample documents into the vector store."""
    if not force and len(vector_store.documents) > 0:
        print(f"Vector store already contains {len(vector_store.documents)} documents. Skipping seed.")
        return

    print("Seeding sample documents into Knowledge Base...")
    sample_files = list(SAMPLE_DOCS_DIR.glob("*.*"))
    # Filter valid file types
    valid_files = [f for f in sample_files if f.suffix.lower() in [".pdf", ".md", ".txt"]]

    for file_path in valid_files:
        try:
            print(f"  -> Processing: {file_path.name}")
            doc_data = doc_processor.process_file(
                file_path=str(file_path),
                doc_name=file_path.stem.replace("_", " ")
            )
            vector_store.add_document(doc_data)
            print(f"     Indexed {doc_data['chunk_count']} chunks.")
        except Exception as e:
            print(f"     Error processing {file_path.name}: {e}")

    print(f"Seeding complete! Total documents indexed: {len(vector_store.documents)}")

if __name__ == '__main__':
    from config import GEMINI_API_KEY, EMBEDDING_MODEL
    vs = VectorStore(storage_path=VECTOR_STORE_FILE, api_key=GEMINI_API_KEY, embedding_model=EMBEDDING_MODEL)
    dp = DocumentProcessor()
    seed_sample_documents(vs, dp, force=True)
