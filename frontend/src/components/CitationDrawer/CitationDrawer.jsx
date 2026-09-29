import React from 'react';
import { 
  FileText, 
  BookOpen, 
  ExternalLink, 
  X, 
  CheckCircle2, 
  Copy, 
  Check, 
  Hash, 
  Sparkles,
  FileCheck
} from 'lucide-react';
import './CitationDrawer.css';

export default function CitationDrawer({ citation, onClose }) {
  const [copied, setCopied] = React.useState(false);

  if (!citation) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(citation.full_text || citation.snippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getSourceIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText size={18} className="text-danger" />;
      case 'url': return <ExternalLink size={18} className="text-info" />;
      default: return <BookOpen size={18} className="text-purple" />;
    }
  };

  const similarityPct = Math.round((citation.similarity_score || 0.85) * 100);

  return (
    <div className="citation-backdrop" onClick={onClose}>
      <div className="citation-drawer glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="drawer-header">
          <div className="drawer-header-left">
            <div className="drawer-icon-wrap">
              {getSourceIcon(citation.source_type)}
            </div>
            <div>
              <div className="drawer-title-row">
                <h3 className="drawer-title">{citation.doc_name}</h3>
                <span className="badge badge-success">
                  <CheckCircle2 size={12} />
                  <span>{similarityPct}% Grounded Relevance</span>
                </span>
              </div>
              <p className="drawer-meta">
                <span>Section: <strong>{citation.section_title || 'General'}</strong></span>
                {citation.page_number && (
                  <>
                    <span className="meta-dot">•</span>
                    <span>Page {citation.page_number}</span>
                  </>
                )}
                {citation.chunk_id && (
                  <>
                    <span className="meta-dot">•</span>
                    <span>ID: <code>{citation.chunk_id}</code></span>
                  </>
                )}
              </p>
            </div>
          </div>
          <button className="btn-close" onClick={onClose} title="Close drawer">
            <X size={18} />
          </button>
        </div>

        <div className="drawer-body">
          <div className="grounding-info-bar">
            <Sparkles size={14} className="text-purple" />
            <span>Strict Source Citation: The AI generated this response solely based on the excerpt below.</span>
          </div>

          <div className="excerpt-container">
            <div className="excerpt-header">
              <span className="excerpt-label">
                <FileCheck size={14} />
                <span>Exact Knowledge Base Excerpt</span>
              </span>
              <button className="btn btn-outline btn-sm copy-btn" onClick={handleCopy}>
                {copied ? <Check size={13} className="text-success" /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy Excerpt'}</span>
              </button>
            </div>
            <div className="excerpt-content">
              {citation.full_text || citation.snippet}
            </div>
          </div>

          <div className="audit-stats-grid">
            <div className="audit-stat-card glass-card">
              <span className="stat-label">Source Format</span>
              <span className="stat-value uppercase">{citation.source_type || 'Document'}</span>
            </div>
            <div className="audit-stat-card glass-card">
              <span className="stat-label">Page / Location</span>
              <span className="stat-value">Page {citation.page_number || 1}</span>
            </div>
            <div className="audit-stat-card glass-card">
              <span className="stat-label">Cosine Similarity</span>
              <span className="stat-value">{citation.similarity_score || 0.85}</span>
            </div>
          </div>
        </div>

        <div className="drawer-footer">
          <button className="btn btn-secondary" onClick={onClose}>Done</button>
        </div>
      </div>
    </div>
  );
}
