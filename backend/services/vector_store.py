import json
import logging
import numpy as np
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

try:
    from google import genai
    from google.genai import types
    GENAI_AVAILABLE = True
except ImportError:
    GENAI_AVAILABLE = False

logger = logging.getLogger(__name__)

class VectorStore:
    """
    Lightweight, persistent Vector Database supporting both Google Gemini dense
    embeddings and resilient local TF-IDF semantic vector similarity.
    """

    def __init__(self, storage_path: Path, api_key: str = "", embedding_model: str = "text-embedding-004"):
        self.storage_path = Path(storage_path)
        self.api_key = api_key
        self.embedding_model = embedding_model
        
        # In-memory document registry & chunks
        self.documents: Dict[str, Dict[str, Any]] = {}
        self.chunks: List[Dict[str, Any]] = []
        
        # Dense embeddings cache: chunk_id -> list of floats
        self.embeddings: Dict[str, List[float]] = {}
        
        # Fallback TF-IDF vectorizer and matrix
        self.tfidf_vectorizer: Optional[TfidfVectorizer] = None
        self.tfidf_matrix = None
        
        self.client = None
        if self.api_key and GENAI_AVAILABLE:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Failed to initialize Gemini client for embeddings: {e}")

        # Load persisted data if available
        self.load()

    def set_api_key(self, api_key: str):
        self.api_key = api_key
        if self.api_key and GENAI_AVAILABLE:
            try:
                self.client = genai.Client(api_key=self.api_key)
            except Exception as e:
                logger.warning(f"Could not initialize Gemini Client with new API key: {e}")
                self.client = None
        else:
            self.client = None

    def add_document(self, doc_data: Dict[str, Any]) -> Dict[str, Any]:
        doc_id = doc_data["doc_id"]
        doc_name = doc_data["doc_name"]
        new_chunks = doc_data.get("chunks", [])

        # Store document metadata
        self.documents[doc_id] = {
            "doc_id": doc_id,
            "doc_name": doc_name,
            "source_type": doc_data.get("source_type", "text"),
            "file_path": doc_data.get("file_path"),
            "url": doc_data.get("url"),
            "char_count": doc_data.get("char_count", 0),
            "chunk_count": len(new_chunks),
            "indexed_at": datetime.now(timezone.utc).isoformat()
        }

        # Remove existing chunks for this doc if updating
        self.chunks = [c for c in self.chunks if c.get("doc_id") != doc_id]

        # Append new chunks
        self.chunks.extend(new_chunks)

        # Generate embeddings if Gemini client is active
        if self.client and new_chunks:
            self._generate_gemini_embeddings(new_chunks)

        # Re-fit local vectorizer
        self._reindex_tfidf()

        # Save to disk
        self.save()

        return self.documents[doc_id]

    def delete_document(self, doc_id: str) -> bool:
        if doc_id not in self.documents:
            return False

        del self.documents[doc_id]
        
        # Remove chunks
        deleted_chunk_ids = {c["chunk_id"] for c in self.chunks if c.get("doc_id") == doc_id}
        self.chunks = [c for c in self.chunks if c.get("doc_id") != doc_id]

        for cid in deleted_chunk_ids:
            self.embeddings.pop(cid, None)

        self._reindex_tfidf()
        self.save()
        return True

    def list_documents(self) -> List[Dict[str, Any]]:
        return list(self.documents.values())

    def get_document_chunks(self, doc_id: str) -> List[Dict[str, Any]]:
        return [c for c in self.chunks if c.get("doc_id") == doc_id]

    def search(self, query: str, top_k: int = 4, threshold: float = 0.30) -> List[Dict[str, Any]]:
        """
        Retrieves top_k relevant chunks for the query with cosine similarity scores.
        Uses Gemini embeddings if available; falls back to TF-IDF cosine similarity.
        """
        if not self.chunks:
            return []

        results = []

        # Attempt dense search if Gemini client and embeddings exist
        used_gemini = False
        if self.client and self.embeddings:
            try:
                query_vec = self._embed_single_text(query)
                if query_vec is not None:
                    scored_chunks = []
                    q_norm = np.linalg.norm(query_vec)
                    if q_norm > 0:
                        for chunk in self.chunks:
                            cid = chunk["chunk_id"]
                            c_vec = self.embeddings.get(cid)
                            if c_vec:
                                c_arr = np.array(c_vec)
                                c_norm = np.linalg.norm(c_arr)
                                if c_norm > 0:
                                    score = float(np.dot(query_vec, c_arr) / (q_norm * c_norm))
                                    scored_chunks.append((chunk, score))
                    
                    scored_chunks.sort(key=lambda x: x[1], reverse=True)
                    for chunk, score in scored_chunks[:top_k]:
                        chunk_copy = dict(chunk)
                        chunk_copy["similarity_score"] = round(score, 4)
                        results.append(chunk_copy)
                    used_gemini = True
            except Exception as e:
                logger.warning(f"Dense Gemini search failed, falling back to TF-IDF: {e}")

        # Resilient TF-IDF fallback
        if not used_gemini or not results:
            results = self._search_tfidf(query, top_k)
            # Scale TF-IDF scores for intuitive presentation (0.15 -> ~0.75 confidence)
            for r in results:
                r["similarity_score"] = round(min(0.99, r["similarity_score"] * 3.5), 4)

        # Apply threshold filtering (adaptive: if dense use threshold, if TF-IDF scaled use threshold)
        effective_threshold = threshold if used_gemini else max(0.12, threshold * 0.6)
        filtered_results = [r for r in results if r["similarity_score"] >= effective_threshold]
        return filtered_results

    def _search_tfidf(self, query: str, top_k: int) -> List[Dict[str, Any]]:
        if not self.chunks or self.tfidf_matrix is None or self.tfidf_vectorizer is None:
            return []

        try:
            query_vec = self.tfidf_vectorizer.transform([query])
            sim_scores = cosine_similarity(query_vec, self.tfidf_matrix).flatten()
            
            top_indices = np.argsort(sim_scores)[::-1][:top_k]
            results = []
            for idx in top_indices:
                score = float(sim_scores[idx])
                chunk = dict(self.chunks[idx])
                chunk["similarity_score"] = round(score, 4)
                results.append(chunk)
            return results
        except Exception as e:
            logger.error(f"TF-IDF search error: {e}")
            return []

    def _chunk_index_text(self, chunk: Dict[str, Any]) -> str:
        doc = chunk.get("doc_name", "")
        sec = chunk.get("section_title", "")
        text = chunk.get("text", "")
        return f"{doc} {sec}\n{text}"

    def _generate_gemini_embeddings(self, chunks_to_embed: List[Dict[str, Any]]):
        if not self.client:
            return

        texts = [self._chunk_index_text(c) for c in chunks_to_embed]
        try:
            batch_size = 20
            for i in range(0, len(texts), batch_size):
                batch_texts = texts[i:i + batch_size]
                batch_chunks = chunks_to_embed[i:i + batch_size]

                response = self.client.models.embed_content(
                    model=self.embedding_model,
                    contents=batch_texts
                )

                if hasattr(response, "embeddings"):
                    for chunk, emb in zip(batch_chunks, response.embeddings):
                        values = emb.values if hasattr(emb, "values") else emb
                        self.embeddings[chunk["chunk_id"]] = list(values)
        except Exception as e:
            logger.warning(f"Could not generate Gemini embeddings: {e}")

    def _embed_single_text(self, text: str) -> Optional[np.ndarray]:
        if not self.client:
            return None
        try:
            response = self.client.models.embed_content(
                model=self.embedding_model,
                contents=[text]
            )
            if hasattr(response, "embeddings") and response.embeddings:
                emb = response.embeddings[0]
                values = emb.values if hasattr(emb, "values") else emb
                return np.array(values)
        except Exception as e:
            logger.warning(f"Single text embedding failed: {e}")
        return None

    def _reindex_tfidf(self):
        if not self.chunks:
            self.tfidf_matrix = None
            self.tfidf_vectorizer = None
            return

        texts = [self._chunk_index_text(c) for c in self.chunks]
        try:
            self.tfidf_vectorizer = TfidfVectorizer(
                ngram_range=(1, 2),
                sublinear_tf=True,
                stop_words="english",
                token_pattern=r"(?u)\b\w+\b"
            )
            self.tfidf_matrix = self.tfidf_vectorizer.fit_transform(texts)
        except Exception as e:
            logger.error(f"Error reindexing TF-IDF: {e}")

    def get_stats(self) -> Dict[str, Any]:
        total_tokens = sum(c.get("token_estimate", 0) for c in self.chunks)
        return {
            "total_documents": len(self.documents),
            "total_chunks": len(self.chunks),
            "total_tokens_estimate": total_tokens,
            "has_gemini_embeddings": len(self.embeddings) > 0,
            "dense_embeddings_count": len(self.embeddings),
            "is_gemini_active": bool(self.client is not None)
        }

    def clear(self):
        self.documents = {}
        self.chunks = []
        self.embeddings = {}
        self.tfidf_matrix = None
        self.tfidf_vectorizer = None
        self.save()

    def save(self):
        try:
            self.storage_path.parent.mkdir(parents=True, exist_ok=True)
            data = {
                "documents": self.documents,
                "chunks": self.chunks,
                "embeddings": self.embeddings,
                "saved_at": datetime.now(timezone.utc).isoformat()
            }
            with open(self.storage_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
        except Exception as e:
            logger.error(f"Failed to save vector store: {e}")

    def load(self):
        if not self.storage_path.exists():
            return

        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                data = json.load(f)

            self.documents = data.get("documents", {})
            self.chunks = data.get("chunks", [])
            self.embeddings = data.get("embeddings", {})

            self._reindex_tfidf()
            logger.info(f"Loaded {len(self.documents)} documents and {len(self.chunks)} chunks from vector store.")
        except Exception as e:
            logger.error(f"Failed to load vector store from {self.storage_path}: {e}")
