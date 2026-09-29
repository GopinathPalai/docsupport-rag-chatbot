import os
import re
import uuid
from pathlib import Path
from typing import List, Dict, Any, Optional
import requests
from bs4 import BeautifulSoup
from pypdf import PdfReader

class DocumentProcessor:
    """
    Parses and chunks documents (PDF, Markdown, Text, Web URLs) into
    searchable chunks with rich citation metadata.
    """

    def __init__(self, chunk_size: int = 600, chunk_overlap: int = 100):
        self.chunk_size = chunk_size
        self.chunk_overlap = chunk_overlap

    def process_file(self, file_path: str, doc_name: Optional[str] = None) -> Dict[str, Any]:
        path = Path(file_path)
        if not path.exists():
            raise FileNotFoundError(f"File not found: {file_path}")

        name = doc_name or path.name
        doc_id = str(uuid.uuid4())[:8]
        ext = path.suffix.lower()

        if ext == ".pdf":
            sections = self._extract_from_pdf(path)
            source_type = "pdf"
        elif ext in [".md", ".markdown", ".txt"]:
            sections = self._extract_from_text(path)
            source_type = "markdown" if ext in [".md", ".markdown"] else "text"
        else:
            # Fallback text reading
            sections = self._extract_from_text(path)
            source_type = "text"

        chunks = self._chunk_sections(sections, doc_id, name, source_type)

        return {
            "doc_id": doc_id,
            "doc_name": name,
            "source_type": source_type,
            "file_path": str(path),
            "char_count": sum(len(s.get("text", "")) for s in sections),
            "chunk_count": len(chunks),
            "chunks": chunks
        }

    def process_url(self, url: str) -> Dict[str, Any]:
        """Scrapes web page or FAQ article and chunks its content."""
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
        }
        resp = requests.get(url, headers=headers, timeout=12)
        resp.raise_for_status()

        soup = BeautifulSoup(resp.text, "html.parser")

        # Strip scripts, styles, nav, and footers
        for tag in soup(["script", "style", "nav", "footer", "header", "noscript", "svg"]):
            tag.decompose()

        title = soup.title.string.strip() if soup.title and soup.title.string else url

        # Find main content or fallback to body
        main_content = soup.find("main") or soup.find("article") or soup.find("div", class_=re.compile(r"content|body|post|article", re.I)) or soup.body

        if not main_content:
            raw_text = soup.get_text(separator="\n")
        else:
            raw_text = main_content.get_text(separator="\n")

        # Clean text
        lines = [line.strip() for line in raw_text.splitlines() if line.strip()]
        cleaned_text = "\n".join(lines)

        doc_id = str(uuid.uuid4())[:8]
        sections = [{"text": cleaned_text, "page_number": 1, "section_title": title}]
        chunks = self._chunk_sections(sections, doc_id, title, "url")

        return {
            "doc_id": doc_id,
            "doc_name": title,
            "source_type": "url",
            "url": url,
            "char_count": len(cleaned_text),
            "chunk_count": len(chunks),
            "chunks": chunks
        }

    def process_raw_text(self, text: str, title: str) -> Dict[str, Any]:
        """Processes raw text or pasted FAQ content."""
        doc_id = str(uuid.uuid4())[:8]
        sections = [{"text": text, "page_number": 1, "section_title": title}]
        chunks = self._chunk_sections(sections, doc_id, title, "faq")

        return {
            "doc_id": doc_id,
            "doc_name": title,
            "source_type": "faq",
            "char_count": len(text),
            "chunk_count": len(chunks),
            "chunks": chunks
        }

    def _extract_from_pdf(self, path: Path) -> List[Dict[str, Any]]:
        sections = []
        reader = PdfReader(str(path))
        for page_idx, page in enumerate(reader.pages, start=1):
            text = page.extract_text() or ""
            # Clean up whitespace
            text = re.sub(r"\s+", " ", text).strip()
            if text:
                sections.append({
                    "text": text,
                    "page_number": page_idx,
                    "section_title": f"Page {page_idx}"
                })
        return sections

    def _extract_from_text(self, path: Path) -> List[Dict[str, Any]]:
        with open(path, "r", encoding="utf-8", errors="replace") as f:
            content = f.read()

        # Try to parse markdown sections
        heading_pattern = re.compile(r"^(#{1,4}\s+.+)$", re.MULTILINE)
        parts = heading_pattern.split(content)

        sections = []
        if len(parts) > 1:
            current_title = "Overview"
            idx = 0
            while idx < len(parts):
                part = parts[idx].strip()
                if heading_pattern.match(part):
                    current_title = part.lstrip("#").strip()
                    idx += 1
                    if idx < len(parts):
                        body = parts[idx].strip()
                        if body:
                            sections.append({
                                "text": body,
                                "page_number": 1,
                                "section_title": current_title
                            })
                else:
                    if part:
                        sections.append({
                            "text": part,
                            "page_number": 1,
                            "section_title": current_title
                        })
                idx += 1
        else:
            sections.append({
                "text": content.strip(),
                "page_number": 1,
                "section_title": path.stem.replace("_", " ")
            })

        return sections

    def _chunk_sections(self, sections: List[Dict[str, Any]], doc_id: str, doc_name: str, source_type: str) -> List[Dict[str, Any]]:
        chunks = []
        chunk_idx = 1

        for sec in sections:
            sec_text = sec.get("text", "")
            page_no = sec.get("page_number", 1)
            sec_title = sec.get("section_title", "General")

            if not sec_text:
                continue

            # If section text fits in a single chunk
            if len(sec_text) <= self.chunk_size:
                chunks.append({
                    "chunk_id": f"{doc_id}_c{chunk_idx}",
                    "doc_id": doc_id,
                    "doc_name": doc_name,
                    "source_type": source_type,
                    "page_number": page_no,
                    "section_title": sec_title,
                    "text": sec_text,
                    "char_count": len(sec_text),
                    "token_estimate": max(1, len(sec_text) // 4)
                })
                chunk_idx += 1
                continue

            # Otherwise, split by sentences or paragraphs with overlap
            split_paragraphs = [p.strip() for p in sec_text.split("\n") if p.strip()]
            current_chunk = ""

            for para in split_paragraphs:
                if len(current_chunk) + len(para) + 1 <= self.chunk_size:
                    current_chunk = (current_chunk + "\n" + para).strip()
                else:
                    if current_chunk:
                        chunks.append({
                            "chunk_id": f"{doc_id}_c{chunk_idx}",
                            "doc_id": doc_id,
                            "doc_name": doc_name,
                            "source_type": source_type,
                            "page_number": page_no,
                            "section_title": sec_title,
                            "text": current_chunk,
                            "char_count": len(current_chunk),
                            "token_estimate": max(1, len(current_chunk) // 4)
                        })
                        chunk_idx += 1
                        # Retain overlap from end of current_chunk
                        overlap_start = max(0, len(current_chunk) - self.chunk_overlap)
                        current_chunk = current_chunk[overlap_start:].strip() + "\n" + para
                    else:
                        # Single very long paragraph: break by character window
                        for i in range(0, len(para), self.chunk_size - self.chunk_overlap):
                            slice_text = para[i:i + self.chunk_size].strip()
                            if slice_text:
                                chunks.append({
                                    "chunk_id": f"{doc_id}_c{chunk_idx}",
                                    "doc_id": doc_id,
                                    "doc_name": doc_name,
                                    "source_type": source_type,
                                    "page_number": page_no,
                                    "section_title": sec_title,
                                    "text": slice_text,
                                    "char_count": len(slice_text),
                                    "token_estimate": max(1, len(slice_text) // 4)
                                })
                                chunk_idx += 1
                        current_chunk = ""

            if current_chunk.strip():
                chunks.append({
                    "chunk_id": f"{doc_id}_c{chunk_idx}",
                    "doc_id": doc_id,
                    "doc_name": doc_name,
                    "source_type": source_type,
                    "page_number": page_no,
                    "section_title": sec_title,
                    "text": current_chunk.strip(),
                    "char_count": len(current_chunk.strip()),
                    "token_estimate": max(1, len(current_chunk.strip()) // 4)
                })
                chunk_idx += 1

        return chunks
