# DocuSupport AI: 3 to 5 Minute Demo Video Walkthrough Script

Use this exact, timed step-by-step recording guide when recording your project demo video (using OBS Studio, Loom, or Windows Game Bar `Win + G`).

---

## Video Overview & Target Timing (3:30 - 4:30 Total)

| Section | Timestamp | Key Action | Goal |
|---|---|---|---|
| 1. Introduction | 0:00 - 0:35 | Introduce project, problem, and tech stack | Overview & marks alignment |
| 2. Grounded Q&A & Citations | 0:35 - 1:25 | Ask Pricing & Refund questions, click citation chip | Prove grounding & citation feature |
| 3. Anti-Hallucination Fallback | 1:25 - 2:05 | Ask Submarine query ("I don't know") | Prove strict fallback criteria |
| 4. Human Support Escalation | 2:05 - 2:50 | Submit support ticket with session context | Prove human handoff & ticket system |
| 5. Admin Dashboard & Gaps | 2:50 - 3:35 | Inspect Unanswered queries, resolve gap, view ticket | Prove Stretch Goal 2 & gap analysis |
| 6. Embeddable Widget Demo | 3:35 - 4:10 | Toggle Embed Widget view on simulated website | Prove Stretch Goal 1 |
| 7. Architecture & Closing | 4:10 - 4:35 | Show Architecture tab & summarize future improvements | Wrap up & score 20/20 marks |

---

## Step-by-Step Recording Instructions & Narration

### [0:00 - 0:35] Part 1: Project Introduction & Problem Statement
- **Screen Action**: Show the main Help Center UI at `http://localhost:5000` with the dark glassmorphic theme.
- **Spoken Narration**:
  > *"Hello! Today I am presenting **DocuSupport AI**, an enterprise-grade Retrieval-Augmented Generation (RAG) Customer Support Chatbot built for Section C of the project assignment.*
  > *Traditional AI support bots often suffer from hallucinations, lack source traceability, and fail to smoothly hand off to human support engineers. DocuSupport AI solves this with verified document grounding, source section citations, strict anti-hallucination guardrails, and an automated escalation pipeline.*
  > *Our stack includes Python Flask, Google Gemini AI (2.5 Flash and text-embedding-004), PyPDF for multi-page document extraction, and a modern React + Vite frontend."*

---

### [0:35 - 1:25] Part 2: Core Feature 1 & 2 - Grounded Q&A with Interactive Citations
- **Screen Action**:
  1. Click the quick prompt pill: **"💰 Pro Tier Pricing"** (or type: *"How much does the Pro tier cost and what is included?"*).
  2. Wait for the bot response to render with the **"98% Document Grounding Match"** badge.
  3. Point out the citation chips at the bottom: `[ApexCloud Pricing and Plans | p.1]`.
  4. Click on the citation chip.
  5. The **Citation Drawer** opens, showing the exact source document, page number, section title, and the verified text excerpt. Click "Done" to close the drawer.
- **Spoken Narration**:
  > *"Let's test our first core feature: accurate question answering from verified documents. I'll click our Pro tier pricing prompt.*
  > *Notice how the bot responds with the exact figures: $29 per user per month billed monthly or $24 billed annually, including 500GB storage and REST API access.*
  > *Crucially, notice the citation chip below the message. When I click it, an interactive Citation Drawer opens, displaying the exact document, section title, page number, and similarity score. This gives customers 100% confidence in the answer's authenticity."*

---

### [0:35 - 2:05] Part 3: Core Feature 3 - Strict Anti-Hallucination Fallback
- **Screen Action**:
  1. Click the quick prompt pill: **"🚫 Test Fallback (Submarine)"** (or type: *"Can I rent a submarine or yacht in the Bahamas?"*).
  2. Point out the warning banner: **"Strict Fallback Triggered"** and the message:
     *"I do not have enough verified information in our company documents to answer this question accurately. Would you like me to connect you with a human support specialist?"*
- **Spoken Narration**:
  > *"Next is a critical evaluation criterion: the chatbot MUST say it does not know when the answer is not in the documents instead of guessing.*
  > *I will ask an out-of-domain question: 'Can I rent a submarine in the Bahamas?'*
  > *Observe that rather than fabricating an answer, our grounding threshold immediately flags the question as outside verified knowledge, politely informs the customer that information is unavailable, and automatically prompts for human escalation."*

---

### [2:05 - 2:50] Part 4: Core Feature 4 & 5 - Human Handoff & Session History
- **Screen Action**:
  1. Click the prompt pill: **"👤 Escalate to Human"** (or click the button **"Create Support Ticket"**).
  2. The **Human Handoff Modal** opens.
  3. Fill out the fields:
     - Name: `Alex Hunter`
     - Email: `alex@apexcloud.io`
     - Priority: `High`
     - Category: `Billing & Pricing`
     - Subject: `Enterprise contract SLA verification`
  4. Click **"Create Priority Ticket"**.
  5. Point out the confirmation screen showing Ticket ID (e.g., `TICK-6988`) and the notice that full conversation history was attached.
  6. Click **"Return to Chat"**.
- **Spoken Narration**:
  > *"When an issue cannot be resolved automatically or the customer explicitly requests a person, DocuSupport AI initiates seamless human escalation.*
  > *Let's open the handoff modal. I'll enter our customer details and select 'High' priority.*
  > *Upon submission, a unique escalation ticket is generated, our SLA response timer is activated, and the entire conversation transcript is automatically bundled with the ticket so the human engineer doesn't make the user repeat themselves."*

---

### [2:50 - 3:35] Part 5: Stretch Goal 2 - Admin Dashboard, Telemetry & Knowledge Gaps
- **Screen Action**:
  1. Click **"Admin & Analytics"** in the top navigation bar.
  2. Highlight the 4 KPI cards:
     - **Deflection Rate**: e.g., 85%
     - **Total Inquiries**
     - **Knowledge Gaps**
     - **Active Escalations**
  3. In **Tab 1 (Unanswered Questions)**, point out the submarine question logged in the table with frequency count.
  4. Click **"Support Tickets Queue"** tab, click on `Alex Hunter`'s ticket to show the customer details, status dropdown (`Open`, `In Progress`, `Resolved`), internal agent notes, and the attached chat transcript.
  5. In **"Knowledge Base Manager"** tab, point out the 5 indexed documents (including the PDF) and click **"Chunks"** to demonstrate the vector chunk inspector.
- **Spoken Narration**:
  > *"Now let's explore our second stretch goal: the comprehensive Admin Dashboard.*
  > *Here, administrators see real-time deflection telemetry, query volumes, and knowledge gaps.*
  > *Under the 'Unanswered Questions' tab, queries that triggered fallback—like our submarine question—are automatically logged with frequency counts and confidence scores. Admins can resolve gaps with one click.*
  > *Under the 'Support Tickets Queue', we see our newly created ticket, where support reps can update ticket statuses, add internal notes, and review the customer's full chat history.*
  > *And in our Knowledge Base Manager, admins can upload new PDFs, scrape live website URLs, or inspect individual chunks and token counts."*

---

### [3:35 - 4:10] Part 6: Stretch Goal 1 - Embeddable Website Widget
- **Screen Action**:
  1. Click **"Embed Widget Demo"** in the top navigation bar.
  2. Show the simulated customer website (*ApexCloud Enterprise Platform*).
  3. Point out the floating circular chat bubble button in the bottom right corner with the pulsing status dot.
  4. Click the floating widget launcher button. The compact chat window pops open.
  5. Type a quick question: *"What is the refund policy?"* and show it answering inside the embedded popup!
- **Spoken Narration**:
  > *"Next is our first stretch goal: the Embeddable Website Widget.*
  > *Here we have simulated a live customer platform. Notice our floating chat bubble in the bottom right corner with an active pulse indicator.*
  > *Clicking the launcher expands a lightweight, floating support window that can be embedded onto any e-commerce or SaaS website with a single component or script tag, providing complete RAG capabilities directly within the customer's existing web portal."*

---

### [4:10 - 4:35] Part 7: Architecture Tab & Future Improvements Wrap-up
- **Screen Action**:
  1. Click **"RAG Pipeline"** in the navbar.
  2. Briefly show the 6-stage architecture flowchart cards (Ingestion $\to$ Chunking $\to$ Vector Store $\to$ Grounding Gate $\to$ Synthesis $\to$ Escalation).
  3. Click **"Run Pipeline"** on the live inspector to show real-time chunk scoring.
- **Spoken Narration**:
  > *"Finally, on our RAG Pipeline page, we can inspect every step of our 6-stage architecture in real time.*
  > *With more time, I would improve the system with Cross-Encoder reranking using Cohere or BGE-Reranker, implement Hypothetical Document Embeddings (HyDE) for complex multi-part queries, and integrate live WebSocket agent chat.*
  > *Thank you for reviewing DocuSupport AI!"*
