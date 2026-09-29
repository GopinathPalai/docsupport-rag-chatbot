import React, { useState } from 'react';
import { 
  Cpu, 
  Database, 
  FileText, 
  Layers, 
  Search, 
  ShieldCheck, 
  Sparkles, 
  Users, 
  ArrowRight, 
  CheckCircle2, 
  AlertTriangle,
  Play,
  FileCheck,
  Code
} from 'lucide-react';
import { api } from '../../services/api';
import './ArchitectureView.css';

export default function ArchitectureView() {
  const [testQuery, setTestQuery] = useState('What is the refund policy for annual subscriptions?');
  const [pipelineResult, setPipelineResult] = useState(null);
  const [running, setRunning] = useState(false);

  const handleRunInspector = async (e) => {
    e?.preventDefault();
    if (!testQuery.trim() || running) return;

    setRunning(true);
    try {
      const res = await api.sendMessage(testQuery, 'pipeline_inspector');
      setPipelineResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="arch-container animate-fade-in">
      <div className="arch-header">
        <div>
          <h2 className="section-title">System Architecture & RAG Pipeline Flow</h2>
          <p className="section-subtitle">
            Comprehensive technical design showcasing multi-stage document processing, dual vector indexing, strict anti-hallucination gates, and human handoff.
          </p>
        </div>
      </div>

      {/* Visual Pipeline Flowchart Cards */}
      <div className="pipeline-flow-grid">
        {/* Stage 1 */}
        <div className="flow-step-card glass-card">
          <div className="step-badge">Stage 1</div>
          <div className="step-icon-wrap">
            <FileText size={22} className="text-purple" />
          </div>
          <h3 className="step-title">Multi-Source Ingestion</h3>
          <p className="step-desc">
            Extracts raw content from multi-page PDFs (PyPDF), Web URLs / FAQs (BeautifulSoup), and Markdown guides.
          </p>
          <div className="step-tags">
            <span className="badge badge-purple">PDF Parser</span>
            <span className="badge badge-info">Web Scraper</span>
            <span className="badge badge-secondary">Markdown</span>
          </div>
        </div>

        {/* Stage 2 */}
        <div className="flow-step-card glass-card">
          <div className="step-badge">Stage 2</div>
          <div className="step-icon-wrap">
            <Layers size={22} className="text-info" />
          </div>
          <h3 className="step-title">Recursive Chunking</h3>
          <p className="step-desc">
            Splits text into 600-char overlapping windows. Preserves page numbers, section titles, and document IDs on every chunk.
          </p>
          <div className="step-tags">
            <span className="badge badge-info">Page Mapping</span>
            <span className="badge badge-purple">Header Tracking</span>
            <span className="badge badge-secondary">Overlap Window</span>
          </div>
        </div>

        {/* Stage 3 */}
        <div className="flow-step-card glass-card">
          <div className="step-badge">Stage 3</div>
          <div className="step-icon-wrap">
            <Database size={22} className="text-success" />
          </div>
          <h3 className="step-title">Dual Vector Store</h3>
          <p className="step-desc">
            Generates dense embeddings with Gemini <code>text-embedding-004</code> or resilient local TF-IDF semantic vector cosine engine.
          </p>
          <div className="step-tags">
            <span className="badge badge-success">Gemini Dense</span>
            <span className="badge badge-warning">TF-IDF Resilient</span>
            <span className="badge badge-secondary">Cosine Matrix</span>
          </div>
        </div>

        {/* Stage 4 */}
        <div className="flow-step-card glass-card">
          <div className="step-badge">Stage 4</div>
          <div className="step-icon-wrap">
            <ShieldCheck size={22} className="text-warning" />
          </div>
          <h3 className="step-title">Strict Grounding Gate</h3>
          <p className="step-desc">
            Anti-hallucination threshold filter. If similarity &lt; threshold, strictly refuses to guess and triggers human handoff.
          </p>
          <div className="step-tags">
            <span className="badge badge-warning">Threshold Gate</span>
            <span className="badge badge-danger">Anti-Hallucination</span>
            <span className="badge badge-purple">Handoff Trigger</span>
          </div>
        </div>

        {/* Stage 5 */}
        <div className="flow-step-card glass-card">
          <div className="step-badge">Stage 5</div>
          <div className="step-icon-wrap">
            <Sparkles size={22} className="text-purple" />
          </div>
          <h3 className="step-title">Grounded Synthesis</h3>
          <p className="step-desc">
            Synthesizes answers strictly from verified context with Gemini 2.5 Flash, generating clickable structured citations.
          </p>
          <div className="step-tags">
            <span className="badge badge-purple">Gemini 2.5 Flash</span>
            <span className="badge badge-info">Citation Builder</span>
            <span className="badge badge-success">Audit Trail</span>
          </div>
        </div>

        {/* Stage 6 */}
        <div className="flow-step-card glass-card">
          <div className="step-badge">Stage 6</div>
          <div className="step-icon-wrap">
            <Users size={22} className="text-info" />
          </div>
          <h3 className="step-title">Human Escalation</h3>
          <p className="step-desc">
            When user requests an agent or question is outside knowledge base, transfers full session transcript to support queue.
          </p>
          <div className="step-tags">
            <span className="badge badge-info">Transcript Transfer</span>
            <span className="badge badge-warning">Ticket System</span>
            <span className="badge badge-success">SLA Tracking</span>
          </div>
        </div>
      </div>

      {/* Live Interactive Pipeline Inspector */}
      <div className="inspector-panel glass-panel">
        <div className="inspector-header">
          <div>
            <h3 className="inspector-title">Live RAG Pipeline Execution Inspector</h3>
            <p className="inspector-subtitle">
              Run any query through the pipeline to inspect real-time chunk retrieval, confidence scores, and grounding decisions.
            </p>
          </div>
        </div>

        <form onSubmit={handleRunInspector} className="inspector-form">
          <input 
            type="text" 
            className="input-field" 
            placeholder="Type a question to inspect (e.g. refund policy, pricing, or submarine test)..."
            value={testQuery}
            onChange={(e) => setTestQuery(e.target.value)}
          />
          <button type="submit" className="btn btn-primary" disabled={running}>
            <Play size={15} />
            <span>{running ? 'Executing Pipeline...' : 'Run Pipeline'}</span>
          </button>
        </form>

        {pipelineResult && (
          <div className="pipeline-output animate-fade-in">
            {/* Decision Banner */}
            <div className={`pipeline-decision-banner ${pipelineResult.is_fallback ? 'decision-fallback' : 'decision-grounded'}`}>
              <div className="decision-left">
                {pipelineResult.is_fallback ? (
                  <AlertTriangle size={24} className="text-warning" />
                ) : (
                  <CheckCircle2 size={24} className="text-success" />
                )}
                <div>
                  <h4 className="decision-title">
                    {pipelineResult.is_fallback 
                      ? 'Strict Fallback Triggered (No Hallucination)' 
                      : 'Document Grounding Verified & Passed'}
                  </h4>
                  <p className="decision-desc">
                    {pipelineResult.is_fallback 
                      ? 'Retrieved similarity fell below threshold or information was outside company knowledge base.'
                      : `Successfully verified against ${pipelineResult.citations?.length || 1} knowledge base source chunks.`}
                  </p>
                </div>
              </div>

              <div className="decision-stats">
                <span className="metric-tag">
                  Confidence Score: <strong>{Math.round(pipelineResult.confidence_score * 100)}%</strong>
                </span>
                <span className="metric-tag">
                  Human Escalation: <strong>{pipelineResult.suggest_handoff ? 'Triggered' : 'Not Needed'}</strong>
                </span>
              </div>
            </div>

            {/* Citations & Retrieved Chunks */}
            <div className="inspector-chunks-grid">
              <div className="inspector-col">
                <h4 className="col-heading">
                  <FileCheck size={16} />
                  <span>Retrieved Knowledge Base Chunks ({pipelineResult.citations?.length || 0})</span>
                </h4>
                {pipelineResult.citations?.length === 0 ? (
                  <div className="empty-chunks-box glass-card">
                    No document chunks met the strict relevance threshold for this query.
                  </div>
                ) : (
                  pipelineResult.citations?.map((cit, idx) => (
                    <div key={idx} className="inspector-chunk-card glass-card">
                      <div className="chunk-meta-header">
                        <strong>{cit.doc_name}</strong>
                        <span className="badge badge-success">{Math.round((cit.similarity_score || 0.8) * 100)}% Match</span>
                      </div>
                      <span className="chunk-section">Section: {cit.section_title} | Page {cit.page_number}</span>
                      <p className="chunk-snippet-text">"{cit.full_text || cit.snippet}"</p>
                    </div>
                  ))
                )}
              </div>

              <div className="inspector-col">
                <h4 className="col-heading">
                  <Sparkles size={16} />
                  <span>Synthesized Output</span>
                </h4>
                <div className="inspector-answer-box glass-card">
                  <p className="answer-text">{pipelineResult.answer}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
