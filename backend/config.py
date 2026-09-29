import os
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
DOCUMENTS_DIR = DATA_DIR / "documents"
SAMPLE_DOCS_DIR = DATA_DIR / "sample_docs"

# Ensure directories exist
DATA_DIR.mkdir(parents=True, exist_ok=True)
DOCUMENTS_DIR.mkdir(parents=True, exist_ok=True)
SAMPLE_DOCS_DIR.mkdir(parents=True, exist_ok=True)

# Data Persistence Paths
VECTOR_STORE_FILE = DATA_DIR / "vector_store.json"
TICKETS_FILE = DATA_DIR / "tickets.json"
UNANSWERED_FILE = DATA_DIR / "unanswered.json"
SESSIONS_FILE = DATA_DIR / "sessions.json"

# RAG Configuration
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
DEFAULT_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash")
EMBEDDING_MODEL = os.getenv("GEMINI_EMBEDDING_MODEL", "text-embedding-004")

# Chunking & Retrieval Parameters
CHUNK_SIZE = int(os.getenv("CHUNK_SIZE", "600"))
CHUNK_OVERLAP = int(os.getenv("CHUNK_OVERLAP", "100"))
TOP_K_RETRIEVAL = int(os.getenv("TOP_K_RETRIEVAL", "4"))
SIMILARITY_THRESHOLD = float(os.getenv("SIMILARITY_THRESHOLD", "0.25"))

# Strict Anti-hallucination Fallback Message
FALLBACK_RESPONSE = (
    "I do not have enough verified information in our company documents to answer this question accurately. "
    "To ensure you get the right details, would you like me to connect you with a human support specialist?"
)
