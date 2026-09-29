import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import uuid

logger = logging.getLogger(__name__)

class AnalyticsService:
    """
    Tracks unanswered questions, deflection rates, and conversational telemetry
    to power the Admin Dashboard and Knowledge Gap analysis.
    """

    def __init__(self, storage_path: Path):
        self.storage_path = Path(storage_path)
        self.unanswered: Dict[str, Dict[str, Any]] = {}
        self.metrics = {
            "total_queries": 0,
            "deflected_queries": 0,
            "escalated_queries": 0,
            "low_confidence_queries": 0,
            "avg_confidence": 0.85
        }
        self.load()

    def record_query(self, query: str, confidence: float, is_fallback: bool, escalated: bool, session_id: str = "default"):
        self.metrics["total_queries"] += 1
        if is_fallback or confidence < 0.40:
            self.metrics["low_confidence_queries"] += 1
            self._add_unanswered(query, confidence, session_id)
        else:
            self.metrics["deflected_queries"] += 1

        if escalated:
            self.metrics["escalated_queries"] += 1

        # Running average confidence
        total = self.metrics["total_queries"]
        curr_avg = self.metrics.get("avg_confidence", 0.85)
        self.metrics["avg_confidence"] = round(((curr_avg * (total - 1)) + confidence) / total, 3)

        self.save()

    def _add_unanswered(self, query: str, confidence: float, session_id: str):
        # Deduplicate or group similar unanswered questions
        clean_q = query.strip()
        now = datetime.now(timezone.utc).isoformat()

        for uid, entry in self.unanswered.items():
            if entry["query"].lower() == clean_q.lower():
                entry["frequency"] += 1
                entry["last_asked"] = now
                entry["sessions"].append(session_id)
                return

        # New entry
        uid = f"unans_{str(uuid.uuid4())[:8]}"
        self.unanswered[uid] = {
            "id": uid,
            "query": clean_q,
            "confidence": round(confidence, 3),
            "frequency": 1,
            "first_asked": now,
            "last_asked": now,
            "sessions": [session_id],
            "status": "unresolved" # unresolved, resolved_kb, resolved_ignored
        }

    def list_unanswered(self, status: Optional[str] = None) -> List[Dict[str, Any]]:
        results = list(self.unanswered.values())
        if status and status.lower() != "all":
            results = [u for u in results if u.get("status") == status.lower()]
        
        # Sort by frequency descending, then by last asked
        results.sort(key=lambda x: (x.get("frequency", 1), x.get("last_asked", "")), reverse=True)
        return results

    def resolve_unanswered(self, item_id: str, action: str = "resolved_kb") -> bool:
        if item_id in self.unanswered:
            self.unanswered[item_id]["status"] = action
            self.unanswered[item_id]["resolved_at"] = datetime.now(timezone.utc).isoformat()
            self.save()
            return True
        return False

    def get_analytics(self) -> Dict[str, Any]:
        total = max(1, self.metrics["total_queries"])
        deflected = self.metrics["deflected_queries"]
        deflection_rate = round((deflected / total) * 100, 1)

        unresolved_count = sum(1 for u in self.unanswered.values() if u.get("status") == "unresolved")

        return {
            "total_queries": self.metrics["total_queries"],
            "deflected_queries": deflected,
            "deflection_rate_pct": deflection_rate,
            "escalated_queries": self.metrics["escalated_queries"],
            "low_confidence_queries": self.metrics["low_confidence_queries"],
            "unresolved_gaps": unresolved_count,
            "avg_confidence_pct": round(self.metrics.get("avg_confidence", 0.85) * 100, 1)
        }

    def save(self):
        try:
            self.storage_path.parent.mkdir(parents=True, exist_ok=True)
            data = {
                "metrics": self.metrics,
                "unanswered": self.unanswered
            }
            with open(self.storage_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save analytics: {e}")

    def load(self):
        if not self.storage_path.exists():
            return
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                data = json.load(f)
            self.metrics = data.get("metrics", self.metrics)
            self.unanswered = data.get("unanswered", {})
        except Exception as e:
            logger.error(f"Failed to load analytics: {e}")
