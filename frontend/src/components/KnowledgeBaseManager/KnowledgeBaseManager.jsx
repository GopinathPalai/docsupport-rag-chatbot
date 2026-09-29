import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Upload, 
  Globe, 
  PlusCircle, 
  Trash2, 
  Eye, 
  RefreshCw, 
  FileCheck, 
  Layers, 
  AlertCircle,
  CheckCircle2,
  X,
  FileCode,
  BookOpen
} from 'lucide-react';
import { api } from '../../services/api';
import './KnowledgeBaseManager.css';

export default function KnowledgeBaseManager({ onDocumentsChanged }) {
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [actionMessage, setActionMessage] = useState({ text: '', type: '' });

  // Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  // Scraper state
  const [scrapeUrl, setScrapeUrl] = useState('');
  const [scraping, setScraping] = useState(false);

  // FAQ state
  const [faqTitle, setFaqTitle] = useState('');
  const [faqText, setFaqText] = useState('');
  const [addingFaq, setAddingFaq] = useState(false);

  // Chunk Inspector state
  const [inspectDoc, setInspectDoc] = useState(null);
  const [inspectChunks, setInspectChunks] = useState([]);
  const [inspectLoading, setInspectLoading] = useState(false);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const res = await api.getDocuments();
      setDocuments(res.documents || []);
      setStats(res.stats || null);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const showFeedback = (text, type = 'success') => {
    setActionMessage({ text, type });
    setTimeout(() => setActionMessage({ text: '', type: '' }), 4000);
  };

  const handleFileUpload = async (e) => {
    e.preventDefault();
    if (!selectedFile) return;

    setUploading(true);
    try {
      const res = await api.uploadDocument(selectedFile);
      if (res.success) {
        showFeedback(res.message, 'success');
        setSelectedFile(null);
        fetchDocuments();
        if (onDocumentsChanged) onDocumentsChanged();
      } else {
        showFeedback(res.error || 'Upload failed', 'danger');
      }
    } catch (err) {
      showFeedback('Error uploading document', 'danger');
    } finally {
      setUploading(false);
    }
  };

  const handleScrape = async (e) => {
    e.preventDefault();
    if (!scrapeUrl.trim()) return;

    setScraping(true);
    try {
      const res = await api.scrapeUrl(scrapeUrl);
      if (res.success) {
        showFeedback(res.message, 'success');
        setScrapeUrl('');
        fetchDocuments();
        if (onDocumentsChanged) onDocumentsChanged();
      } else {
        showFeedback(res.error || 'Scraping failed', 'danger');
      }
    } catch (err) {
      showFeedback('Error connecting to webpage', 'danger');
    } finally {
      setScraping(false);
    }
  };

  const handleAddFaq = async (e) => {
    e.preventDefault();
    if (!faqTitle.trim() || !faqText.trim()) return;

    setAddingFaq(true);
    try {
      const res = await api.addRawText(faqTitle, faqText);
      if (res.success) {
        showFeedback(res.message, 'success');
        setFaqTitle('');
        setFaqText('');
        fetchDocuments();
        if (onDocumentsChanged) onDocumentsChanged();
      } else {
        showFeedback(res.error || 'Failed to add FAQ', 'danger');
      }
    } catch (err) {
      showFeedback('Error adding FAQ entry', 'danger');
    } finally {
      setAddingFaq(false);
    }
  };

  const handleDelete = async (docId, docName) => {
    if (!window.confirm(`Are you sure you want to delete "${docName}" from the vector database?`)) return;

    try {
      const res = await api.deleteDocument(docId);
      if (res.success) {
        showFeedback(`Deleted "${docName}"`, 'success');
        fetchDocuments();
        if (onDocumentsChanged) onDocumentsChanged();
      }
    } catch (err) {
      showFeedback('Failed to delete document', 'danger');
    }
  };

  const handleInspectChunks = async (doc) => {
    setInspectDoc(doc);
    setInspectLoading(true);
    try {
      const res = await api.getDocumentChunks(doc.doc_id);
      setInspectChunks(res.chunks || []);
    } catch (err) {
      console.error(err);
    } finally {
      setInspectLoading(false);
    }
  };

  const handleReSeed = async () => {
    try {
      const res = await api.seedSampleDocs();
      showFeedback('Sample company documentation re-indexed!', 'success');
      fetchDocuments();
      if (onDocumentsChanged) onDocumentsChanged();
    } catch (err) {
      showFeedback('Failed to reset sample documents', 'danger');
    }
  };

  const getSourceIcon = (type) => {
    switch (type) {
      case 'pdf': return <FileText size={16} className="text-danger" />;
      case 'url': return <Globe size={16} className="text-info" />;
      case 'faq': return <BookOpen size={16} className="text-warning" />;
      default: return <FileCode size={16} className="text-purple" />;
    }
  };

  return (
    <div className="kb-manager-container animate-fade-in">
      {/* Top Banner & Stats */}
      <div className="kb-header-row">
        <div>
          <h2 className="section-title">Knowledge Base & Vector Store</h2>
          <p className="section-subtitle">
            Manage documents, web scrapers, and raw FAQ entries indexed for semantic RAG retrieval.
          </p>
        </div>

        <div className="kb-header-actions">
          <button className="btn btn-outline btn-sm" onClick={handleReSeed} title="Reload default sample docs">
            <RefreshCw size={14} />
            <span>Reset Sample Docs</span>
          </button>
        </div>
      </div>

      {actionMessage.text && (
        <div className={`action-alert badge-${actionMessage.type}`}>
          {actionMessage.type === 'success' ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          <span>{actionMessage.text}</span>
        </div>
      )}

      {/* Ingestion Cards (3 columns) */}
      <div className="ingestion-grid">
        {/* Upload File Card */}
        <div className="glass-card ingestion-card">
          <div className="card-header-icon">
            <Upload size={18} className="text-purple" />
            <h3 className="card-heading">Upload Document</h3>
          </div>
          <p className="card-desc">Support for PDF, Markdown (.md), and plain text files.</p>
          
          <form onSubmit={handleFileUpload} className="card-form">
            <input 
              type="file" 
              accept=".pdf,.txt,.md,.markdown"
              onChange={(e) => setSelectedFile(e.target.files[0])}
              className="file-input-custom"
            />
            {selectedFile && (
              <span className="selected-filename">Selected: {selectedFile.name}</span>
            )}
            <button 
              type="submit" 
              className="btn btn-primary btn-sm" 
              disabled={!selectedFile || uploading}
            >
              {uploading ? 'Processing Chunks...' : 'Upload & Index'}
            </button>
          </form>
        </div>

        {/* Web Scraper Card */}
        <div className="glass-card ingestion-card">
          <div className="card-header-icon">
            <Globe size={18} className="text-info" />
            <h3 className="card-heading">Scrape Webpage or FAQ</h3>
          </div>
          <p className="card-desc">Fetches article/page text, cleans HTML, and generates vector chunks.</p>

          <form onSubmit={handleScrape} className="card-form">
            <input 
              type="url" 
              className="input-field"
              placeholder="https://example.com/support/faq"
              value={scrapeUrl}
              onChange={(e) => setScrapeUrl(e.target.value)}
            />
            <button 
              type="submit" 
              className="btn btn-secondary btn-sm" 
              disabled={!scrapeUrl.trim() || scraping}
            >
              {scraping ? 'Scraping Webpage...' : 'Scrape & Embed'}
            </button>
          </form>
        </div>

        {/* Add Raw FAQ Snippet */}
        <div className="glass-card ingestion-card">
          <div className="card-header-icon">
            <PlusCircle size={18} className="text-success" />
            <h3 className="card-heading">Add Quick FAQ Entry</h3>
          </div>
          <p className="card-desc">Directly paste an answered question or policy snippet.</p>

          <form onSubmit={handleAddFaq} className="card-form">
            <input 
              type="text"
              className="input-field"
              placeholder="Question / Policy Title"
              value={faqTitle}
              onChange={(e) => setFaqTitle(e.target.value)}
            />
            <textarea 
              className="input-field faq-textarea"
              placeholder="Verified answer content..."
              rows="2"
              value={faqText}
              onChange={(e) => setFaqText(e.target.value)}
            ></textarea>
            <button 
              type="submit" 
              className="btn btn-secondary btn-sm" 
              disabled={!faqTitle.trim() || !faqText.trim() || addingFaq}
            >
              {addingFaq ? 'Indexing...' : 'Index FAQ'}
            </button>
          </form>
        </div>
      </div>

      {/* Indexed Documents Table */}
      <div className="docs-table-wrapper glass-panel">
        <div className="docs-table-header">
          <div>
            <h3 className="table-title">Indexed Knowledge Base Documents</h3>
            <span className="table-subtitle">
              {documents.length} documents indexed ({stats?.total_chunks || 0} total chunks in vector store)
            </span>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={fetchDocuments}>
            <RefreshCw size={13} className={loading ? 'spin' : ''} />
            <span>Refresh</span>
          </button>
        </div>

        <table className="docs-table">
          <thead>
            <tr>
              <th>Document Name</th>
              <th>Format</th>
              <th>Chunks</th>
              <th>Char Count</th>
              <th>Indexed Date</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {documents.length === 0 ? (
              <tr>
                <td colSpan="6" className="empty-table-cell">
                  No documents found. Click "Reset Sample Docs" to seed default company policies.
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.doc_id}>
                  <td className="doc-name-cell">
                    <div className="doc-icon-title">
                      {getSourceIcon(doc.source_type)}
                      <span className="doc-name-text">{doc.doc_name}</span>
                    </div>
                  </td>
                  <td>
                    <span className="badge badge-purple uppercase">{doc.source_type}</span>
                  </td>
                  <td>
                    <span className="chunk-count-badge">
                      <Layers size={12} />
                      <span>{doc.chunk_count} chunks</span>
                    </span>
                  </td>
                  <td>{doc.char_count?.toLocaleString()} chars</td>
                  <td>
                    {doc.indexed_at ? new Date(doc.indexed_at).toLocaleDateString() : 'Active'}
                  </td>
                  <td className="text-right">
                    <div className="row-actions">
                      <button 
                        className="btn btn-outline btn-sm action-icon-btn"
                        onClick={() => handleInspectChunks(doc)}
                        title="Inspect Vector Chunks"
                      >
                        <Eye size={14} />
                        <span>Chunks</span>
                      </button>
                      <button 
                        className="btn btn-danger btn-sm action-icon-btn"
                        onClick={() => handleDelete(doc.doc_id, doc.doc_name)}
                        title="Delete Document"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Chunk Inspector Modal */}
      {inspectDoc && (
        <div className="modal-backdrop" onClick={() => setInspectDoc(null)}>
          <div className="inspect-modal glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="inspect-header">
              <div>
                <h3 className="inspect-title">Vector Chunks: {inspectDoc.doc_name}</h3>
                <span className="inspect-subtitle">
                  Document ID: <code>{inspectDoc.doc_id}</code> | Total Chunks: {inspectChunks.length}
                </span>
              </div>
              <button className="btn-close" onClick={() => setInspectDoc(null)}>
                <X size={18} />
              </button>
            </div>

            <div className="inspect-body">
              {inspectLoading ? (
                <div className="loading-state">Loading chunks...</div>
              ) : inspectChunks.length === 0 ? (
                <div className="empty-state">No chunks found for this document.</div>
              ) : (
                <div className="chunks-list">
                  {inspectChunks.map((chunk, idx) => (
                    <div key={chunk.chunk_id || idx} className="chunk-card glass-card">
                      <div className="chunk-card-header">
                        <div className="chunk-badge-row">
                          <span className="badge badge-purple">Chunk #{idx + 1}</span>
                          <span className="chunk-id-tag">ID: <code>{chunk.chunk_id}</code></span>
                          {chunk.page_number && (
                            <span className="badge badge-info">Page {chunk.page_number}</span>
                          )}
                          <span className="badge badge-secondary">{chunk.section_title || 'General'}</span>
                        </div>
                        <span className="chunk-tokens">~{chunk.token_estimate || Math.round(chunk.char_count / 4)} tokens</span>
                      </div>
                      <div className="chunk-text">
                        {chunk.text}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="inspect-footer">
              <button className="btn btn-secondary" onClick={() => setInspectDoc(null)}>
                Close Inspector
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
