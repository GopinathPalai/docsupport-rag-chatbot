import os
import sys
import unittest
from pathlib import Path

# Add backend directory to sys.path
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

from config import DATA_DIR
from services.document_processor import DocumentProcessor
from services.vector_store import VectorStore
from services.ticket_service import TicketService
from services.analytics_service import AnalyticsService
from services.rag_engine import RAGEngine

class TestRAGCustomerSupport(unittest.TestCase):

    @classmethod
    def setUpClass(cls):
        test_data_dir = DATA_DIR / "test_scratch"
        test_data_dir.mkdir(parents=True, exist_ok=True)
        cls.vector_file = test_data_dir / "test_vector.json"
        cls.tickets_file = test_data_dir / "test_tickets.json"
        cls.unans_file = test_data_dir / "test_unans.json"

        cls.doc_processor = DocumentProcessor(chunk_size=400, chunk_overlap=80)
        cls.vector_store = VectorStore(storage_path=cls.vector_file)
        cls.vector_store.clear()
        cls.ticket_service = TicketService(storage_path=cls.tickets_file)
        cls.analytics_service = AnalyticsService(storage_path=cls.unans_file)
        cls.rag_engine = RAGEngine(
            vector_store=cls.vector_store,
            analytics_service=cls.analytics_service,
            similarity_threshold=0.25,
            top_k=3
        )

        # Index test documents
        faq_text = (
            "ApexCloud provides a 30-day money-back guarantee for all annual subscriptions. "
            "If you cancel within 30 days of purchase, you will receive a 100% full refund with no questions asked. "
            "Monthly plans do not receive prorated refunds."
        )
        doc1 = cls.doc_processor.process_raw_text(faq_text, "Refund Policy FAQ")
        cls.vector_store.add_document(doc1)

        pricing_text = (
            "The Professional tier costs $29 per user per month billed monthly, or $24 per user per month billed annually. "
            "It includes 500 GB storage, REST API access, and 99.9% uptime SLA."
        )
        doc2 = cls.doc_processor.process_raw_text(pricing_text, "Pricing Catalog")
        cls.vector_store.add_document(doc2)

    def test_01_document_indexing(self):
        """Verifies documents are processed into chunks and stored in vector database."""
        docs = self.vector_store.list_documents()
        self.assertEqual(len(docs), 2)
        stats = self.vector_store.get_stats()
        self.assertGreaterEqual(stats["total_chunks"], 2)

    def test_02_accurate_answer_with_citations(self):
        """Verifies grounded question answering returns relevant answer and citations."""
        res = self.rag_engine.answer_query("What is the refund policy for annual subscriptions?")
        self.assertFalse(res["is_fallback"])
        self.assertGreater(len(res["citations"]), 0)
        self.assertEqual(res["citations"][0]["doc_name"], "Refund Policy FAQ")
        self.assertIn("30-day money-back guarantee", res["answer"])

    def test_03_strict_anti_hallucination_fallback(self):
        """Verifies bot says it does NOT know when information is outside the documents."""
        res = self.rag_engine.answer_query("Can I rent a submarine or helicopter in the Bahamas?")
        self.assertTrue(res["is_fallback"])
        self.assertTrue(res["suggest_handoff"])
        self.assertEqual(len(res["citations"]), 0)
        self.assertIn("I do not have enough verified information", res["answer"])

    def test_04_human_handoff_intent(self):
        """Verifies explicit human handoff requests are immediately recognized."""
        res = self.rag_engine.answer_query("I want to speak with a human support agent please")
        self.assertTrue(res["hand_off_requested"])
        self.assertTrue(res["suggest_handoff"])
        self.assertIn("human support specialist", res["answer"])

    def test_05_ticket_creation_and_escalation(self):
        """Verifies creating an escalation ticket records history and updates status."""
        ticket = self.ticket_service.create_ticket({
            "customer_name": "Sarah Connor",
            "customer_email": "sarah@cyberdyne.com",
            "priority": "urgent",
            "category": "Billing",
            "subject": "Enterprise contract refund query",
            "message": "Need clarification on 30-day guarantee"
        })
        self.assertIn("TICK-", ticket["ticket_id"])
        self.assertEqual(ticket["status"], "open")
        self.assertEqual(ticket["priority"], "urgent")

        # Update status to in_progress
        updated = self.ticket_service.update_ticket(ticket["ticket_id"], {
            "status": "in_progress",
            "add_note": "Assigned to Senior Billing Specialist."
        })
        self.assertEqual(updated["status"], "in_progress")
        self.assertEqual(len(updated["agent_notes"]), 1)

    def test_06_unanswered_questions_telemetry(self):
        """Verifies unanswered questions are captured in analytics for admin dashboard review."""
        unans = self.analytics_service.list_unanswered()
        self.assertGreater(len(unans), 0)
        # The submarine query should be in unanswered
        queries = [u["query"] for u in unans]
        self.assertTrue(any("submarine" in q.lower() for q in queries))

if __name__ == "__main__":
    unittest.main()
