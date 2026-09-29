import json
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional
from datetime import datetime, timezone
import random

logger = logging.getLogger(__name__)

class TicketService:
    """
    Manages customer support escalation tickets generated when users
    request a human agent or when the AI bot cannot answer from documents.
    """

    def __init__(self, storage_path: Path):
        self.storage_path = Path(storage_path)
        self.tickets: Dict[str, Dict[str, Any]] = {}
        self.load()

    def create_ticket(self, data: Dict[str, Any]) -> Dict[str, Any]:
        ticket_id = f"TICK-{random.randint(1000, 9999)}"
        while ticket_id in self.tickets:
            ticket_id = f"TICK-{random.randint(1000, 9999)}"

        now = datetime.now(timezone.utc).isoformat()
        ticket = {
            "ticket_id": ticket_id,
            "customer_name": data.get("customer_name", "Anonymous User"),
            "customer_email": data.get("customer_email", "customer@example.com"),
            "priority": data.get("priority", "medium").lower(),
            "category": data.get("category", "General Inquiry"),
            "subject": data.get("subject", "Human Support Assistance Requested"),
            "message": data.get("message", "Customer requested escalation from AI Chatbot."),
            "session_id": data.get("session_id", "default"),
            "conversation_history": data.get("conversation_history", []),
            "status": "open", # open, in_progress, resolved
            "assigned_agent": None,
            "agent_notes": [],
            "created_at": now,
            "updated_at": now
        }

        self.tickets[ticket_id] = ticket
        self.save()
        return ticket

    def list_tickets(self, status: Optional[str] = None, priority: Optional[str] = None) -> List[Dict[str, Any]]:
        results = list(self.tickets.values())
        if status and status.lower() != "all":
            results = [t for t in results if t.get("status", "").lower() == status.lower()]
        if priority and priority.lower() != "all":
            results = [t for t in results if t.get("priority", "").lower() == priority.lower()]
        
        # Sort newest first
        results.sort(key=lambda x: x.get("created_at", ""), reverse=True)
        return results

    def get_ticket(self, ticket_id: str) -> Optional[Dict[str, Any]]:
        return self.tickets.get(ticket_id)

    def update_ticket(self, ticket_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        ticket = self.tickets.get(ticket_id)
        if not ticket:
            return None

        for key in ["status", "priority", "category", "assigned_agent", "subject", "message"]:
            if key in updates:
                ticket[key] = updates[key]

        if "add_note" in updates and updates["add_note"]:
            ticket["agent_notes"].append({
                "note": updates["add_note"],
                "author": updates.get("note_author", "Support Agent"),
                "timestamp": datetime.now(timezone.utc).isoformat()
            })

        ticket["updated_at"] = datetime.now(timezone.utc).isoformat()
        self.save()
        return ticket

    def delete_ticket(self, ticket_id: str) -> bool:
        if ticket_id in self.tickets:
            del self.tickets[ticket_id]
            self.save()
            return True
        return False

    def get_stats(self) -> Dict[str, Any]:
        all_t = list(self.tickets.values())
        open_count = sum(1 for t in all_t if t.get("status") == "open")
        in_prog = sum(1 for t in all_t if t.get("status") == "in_progress")
        resolved = sum(1 for t in all_t if t.get("status") == "resolved")
        urgent = sum(1 for t in all_t if t.get("priority") == "urgent")
        return {
            "total_tickets": len(all_t),
            "open_tickets": open_count,
            "in_progress_tickets": in_prog,
            "resolved_tickets": resolved,
            "urgent_tickets": urgent
        }

    def save(self):
        try:
            self.storage_path.parent.mkdir(parents=True, exist_ok=True)
            with open(self.storage_path, "w", encoding="utf-8") as f:
                json.dump(self.tickets, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save tickets: {e}")

    def load(self):
        if not self.storage_path.exists():
            return
        try:
            with open(self.storage_path, "r", encoding="utf-8") as f:
                self.tickets = json.load(f)
        except Exception as e:
            logger.error(f"Failed to load tickets: {e}")
