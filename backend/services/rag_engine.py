import re
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

from .vector_store import VectorStore
from .analytics_service import AnalyticsService

logger = logging.getLogger(__name__)

# Keywords triggering explicit human handoff intent
HUMAN_HANDOFF_PATTERNS = [
    r"\b(human|agent|representative|person|specialist|operator|advisor)\b",
    r"\b(talk to|speak with|connect me to|transfer me to|escalate)\b",
    r"\b(open a ticket|create a ticket|submit ticket|file a ticket|support ticket)\b",
    r"\b(call me|phone number|customer service rep)\b"
]

STRICT_FALLBACK_TEXT = (
    "I do not have enough verified information in our company documents to answer this question accurately. "
    "To make sure you get the exact details, would you like me to connect you with a human support specialist?"
)

class RAGEngine:
    """
    Retrieval-Augmented Generation Engine with strict anti-hallucination,
    source citations, session context preservation, and human handoff detection.
    """

    def __init__(
        self,
        vector_store: VectorStore,
        analytics_service: AnalyticsService,
        api_key: str = "",
        model_name: str = "gemini-2.5-flash",
        similarity_threshold: float = 0.38,
        top_k: int = 4
    ):
        self.vector_store = vector_store
        self.analytics_service = analytics_service
        self.api_key = api_key
        self.model_name = model_name
        self.similarity_threshold = similarity_threshold
        self.top_k = top_k
        
        # Session conversation memory: session_id -> list of {role, content, timestamp}
        self.sessions: Dict[str, List[Dict[str, Any]]] = {}

        self.client = None
        if self.api_key and GENAI_AVAILABLE:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not init Gemini client in RAGEngine: {e}")

    def set_api_key(self, api_key: str):
        self.api_key = api_key
        if self.api_key and GENAI_AVAILABLE:
            try:
                self.client = genai.Client(api_key=self.api_key)
                self.vector_store.set_api_key(api_key)
            except Exception as e:
                logger.warning(f"Failed to update Gemini client: {e}")
                self.client = None
        else:
            self.client = None
            self.vector_store.set_api_key("")

    def get_session_history(self, session_id: str) -> List[Dict[str, Any]]:
        return self.sessions.get(session_id, [])

    def clear_session(self, session_id: str):
        if session_id in self.sessions:
            self.sessions[session_id] = []

    def answer_query(self, query: str, session_id: str = "default") -> Dict[str, Any]:
        """
        Processes a customer query through the RAG pipeline.
        Returns:
            {
                "answer": str,
                "citations": List[Dict],
                "confidence_score": float,
                "is_fallback": bool,
                "suggest_handoff": bool,
                "hand_off_requested": bool,
                "session_id": str,
                "timestamp": str
            }
        """
        now = datetime.now(timezone.utc).isoformat()
        clean_query = query.strip()

        # Init session history
        if session_id not in self.sessions:
            self.sessions[session_id] = []

        history = self.sessions[session_id]

        # 1. Check for explicit human handoff intent
        if self._is_human_handoff_requested(clean_query):
            response_text = (
                "I understand you'd like to speak with a human support specialist! "
                "I can open a priority escalation ticket with our engineering team right now. "
                "Please click the 'Connect with Human Agent' button below to confirm your contact details."
            )
            self._record_turn(session_id, clean_query, response_text)
            self.analytics_service.record_query(
                query=clean_query,
                confidence=1.0,
                is_fallback=False,
                escalated=True,
                session_id=session_id
            )
            return {
                "answer": response_text,
                "citations": [],
                "confidence_score": 1.0,
                "is_fallback": False,
                "suggest_handoff": True,
                "hand_off_requested": True,
                "session_id": session_id,
                "timestamp": now
            }

        # 2. Contextual Query Rewriting (Incorporating multi-turn history)
        search_query = self._build_contextual_query(clean_query, history)

        # 3. Vector Retrieval
        retrieved_chunks = self.vector_store.search(
            query=search_query,
            top_k=self.top_k,
            threshold=0.20 # low threshold for raw search, filter strictly below
        )

        # Determine confidence score from top retrieved similarity
        top_score = retrieved_chunks[0]["similarity_score"] if retrieved_chunks else 0.0

        # 4. Strict Grounding / Anti-Hallucination Fallback Check
        if not retrieved_chunks or top_score < self.similarity_threshold:
            fallback_answer = STRICT_FALLBACK_TEXT
            self._record_turn(session_id, clean_query, fallback_answer)
            self.analytics_service.record_query(
                query=clean_query,
                confidence=top_score,
                is_fallback=True,
                escalated=False,
                session_id=session_id
            )
            return {
                "answer": fallback_answer,
                "citations": [],
                "confidence_score": round(top_score, 3),
                "is_fallback": True,
                "suggest_handoff": True,
                "hand_off_requested": False,
                "session_id": session_id,
                "timestamp": now
            }

        # Format citations
        citations = []
        for chunk in retrieved_chunks:
            snippet = chunk["text"]
            if len(snippet) > 240:
                snippet = snippet[:240].rsplit(" ", 1)[0] + "..."
            citations.append({
                "chunk_id": chunk.get("chunk_id"),
                "doc_name": chunk.get("doc_name"),
                "source_type": chunk.get("source_type"),
                "page_number": chunk.get("page_number", 1),
                "section_title": chunk.get("section_title", "General"),
                "similarity_score": chunk.get("similarity_score"),
                "snippet": snippet,
                "full_text": chunk["text"]
            })

        # 5. Synthesize Answer (Gemini or Grounded Local Generator)
        answer_text, answered_from_docs = self._synthesize_answer(clean_query, retrieved_chunks, history)

        # If LLM itself reports that context doesn't contain answer
        if not answered_from_docs:
            fallback_answer = STRICT_FALLBACK_TEXT
            self._record_turn(session_id, clean_query, fallback_answer)
            self.analytics_service.record_query(
                query=clean_query,
                confidence=top_score,
                is_fallback=True,
                escalated=False,
                session_id=session_id
            )
            return {
                "answer": fallback_answer,
                "citations": [],
                "confidence_score": round(top_score, 3),
                "is_fallback": True,
                "suggest_handoff": True,
                "hand_off_requested": False,
                "session_id": session_id,
                "timestamp": now
            }

        # Successful grounded response
        self._record_turn(session_id, clean_query, answer_text)
        self.analytics_service.record_query(
            query=clean_query,
            confidence=top_score,
            is_fallback=False,
            escalated=False,
            session_id=session_id
        )

        return {
            "answer": answer_text,
            "citations": citations,
            "confidence_score": round(top_score, 3),
            "is_fallback": False,
            "suggest_handoff": False,
            "hand_off_requested": False,
            "session_id": session_id,
            "timestamp": now
        }

    def _is_human_handoff_requested(self, query: str) -> bool:
        lower = query.lower()
        # Direct phrase matches
        direct_matches = [
            "human", "agent", "talk to someone", "representative", 
            "real person", "customer care", "help desk", "file a complaint",
            "support ticket", "escalate"
        ]
        if any(m in lower for m in direct_matches):
            return True

        for pat in HUMAN_HANDOFF_PATTERNS:
            if re.search(pat, lower):
                return True
        return False

    def _build_contextual_query(self, query: str, history: List[Dict[str, Any]]) -> str:
        """If query contains pronouns or brief follow-up, appends recent history context."""
        if not history:
            return query

        follow_up_tokens = ["it", "this", "that", "these", "those", "cost", "price", "how much", "why", "what about"]
        lower = query.lower()
        is_follow_up = len(query.split()) < 6 or any(tok in lower for tok in follow_up_tokens)

        if is_follow_up and len(history) >= 2:
            last_user = history[-2]["content"] if history[-2]["role"] == "user" else ""
            last_bot = history[-1]["content"] if history[-1]["role"] == "assistant" else ""
            # Combine to enrich retrieval context
            return f"{query} {last_user}"

        return query

    def _synthesize_answer(self, query: str, chunks: List[Dict[str, Any]], history: List[Dict[str, Any]]) -> (str, bool):
        """Generates grounded answer using Google Gemini or deterministic grounded synthesis."""
        
        # Build context block with rich metadata citations
        context_blocks = []
        for i, c in enumerate(chunks, 1):
            doc = c.get("doc_name", "Document")
            page = c.get("page_number", 1)
            sec = c.get("section_title", "General")
            context_blocks.append(
                f"[Source {i}] Document: {doc} | Page: {page} | Section: {sec}\n{c['text']}"
            )
        context_str = "\n\n---\n\n".join(context_blocks)

        system_instruction = (
            "You are the official Customer Support AI for ApexCloud. "
            "Your highest directive is FACTUAL GROUNDING and ACCURACY. "
            "Rules you must strictly follow:\n"
            "1. Answer the customer's question using ONLY the provided verified context excerpts.\n"
            "2. If the context does not explicitly contain the information needed to answer the question, "
            "you MUST output exactly: 'NOT_FOUND_IN_DOCUMENTS'. Do not extrapolate, guess, or bring outside knowledge.\n"
            "3. Format your answers clearly and professionally. Use markdown bullets or bold headings when helpful.\n"
            "4. At the end of key points, reference the source document, page, and section."
        )

        prompt = (
            f"{system_instruction}\n\n"
            f"=== VERIFIED COMPANY KNOWLEDGE BASE EXCERPTS ===\n{context_str}\n\n"
            f"=== CUSTOMER QUESTION ===\n{query}\n\n"
            f"=== GROUNDED ANSWER ==="
        )

        # Attempt Gemini API generation
        if self.client:
            try:
                response = self.client.models.generate_content(
                    model=self.model_name,
                    contents=prompt
                )
                generated_text = response.text.strip() if response and response.text else ""
                if "NOT_FOUND_IN_DOCUMENTS" in generated_text:
                    return ("", False)
                if generated_text:
                    return (generated_text, True)
            except Exception as e:
                logger.warning(f"Gemini API call failed, falling back to local synthesis: {e}")

        # Deterministic Grounded Local Synthesizer (Zero-dependency fallback)
        return self._local_grounded_synthesis(query, chunks)

    def _local_grounded_synthesis(self, query: str, chunks: List[Dict[str, Any]]) -> (str, bool):
        """
        Deterministic, grounded response synthesis that extracts relevant sentences
        and formats clean answers with citations when LLM is unavailable or offline.
        """
        top_chunk = chunks[0]
        text = top_chunk["text"]
        doc = top_chunk.get("doc_name", "Knowledge Base")
        page = top_chunk.get("page_number", 1)
        sec = top_chunk.get("section_title", "Overview")

        # Split sentences
        sentences = [s.strip() for s in re.split(r"(?<=[.!?])\s+", text) if s.strip()]
        
        # Find query words
        q_words = set(re.findall(r"\w+", query.lower())) - {"what", "is", "the", "a", "an", "how", "do", "you", "are", "can", "in", "of", "to", "for"}
        
        matching_sentences = []
        for s in sentences:
            s_words = set(re.findall(r"\w+", s.lower()))
            overlap = len(q_words & s_words)
            if overlap > 0:
                matching_sentences.append((s, overlap))

        matching_sentences.sort(key=lambda x: x[1], reverse=True)

        if not matching_sentences:
            # If no direct word overlap found
            return (f"Based on **{doc}** ({sec}), here is the relevant guidance:\n\n{text[:350]}...\n\n*(Source: {doc}, Page {page})*", True)

        selected = [s[0] for s in matching_sentences[:3]]
        body = " ".join(selected)

        answer = (
            f"Based on our official **{doc}** (Section: *{sec}*, Page {page}):\n\n"
            f"{body}\n\n"
            f"*(Reference: {doc} - {sec})*"
        )
        return (answer, True)

    def _record_turn(self, session_id: str, user_msg: str, bot_msg: str):
        now = datetime.now(timezone.utc).isoformat()
        if session_id not in self.sessions:
            self.sessions[session_id] = []
        self.sessions[session_id].append({
            "role": "user",
            "content": user_msg,
            "timestamp": now
        })
        self.sessions[session_id].append({
            "role": "assistant",
            "content": bot_msg,
            "timestamp": now
        })
        # Keep last 20 turns
        if len(self.sessions[session_id]) > 20:
            self.sessions[session_id] = self.sessions[session_id][-20:]
