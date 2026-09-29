import React, { useState, useEffect } from 'react';
import { 
  BarChart3, 
  HelpCircle, 
  Database, 
  Ticket, 
  CheckCircle, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  Search, 
  Filter, 
  Plus, 
  MessageSquare, 
  ExternalLink,
  RefreshCw,
  Send,
  User,
  ShieldAlert,
  Sparkles
} from 'lucide-react';
import { api } from '../../services/api';
import KnowledgeBaseManager from '../KnowledgeBaseManager/KnowledgeBaseManager';
import './AdminDashboard.css';

export default function AdminDashboard({ onOpenFaqWithQuery }) {
  const [activeTab, setActiveTab] = useState('unanswered'); // 'unanswered', 'kb', 'tickets'
  const [analytics, setAnalytics] = useState(null);
  const [unanswered, setUnanswered] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(false);

  // Ticket detail modal
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [agentNote, setAgentNote] = useState('');
  const [ticketStatusUpdate, setTicketStatusUpdate] = useState('');

  // Quick KB resolution modal
  const [resolveItem, setResolveItem] = useState(null);
  const [resolveAnswer, setResolveAnswer] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [analyticsRes, unansRes, ticketsRes] = await Promise.all([
        api.getAnalytics(),
        api.getUnanswered(),
        api.getTickets()
      ]);
      setAnalytics(analyticsRes);
      setUnanswered(unansRes.unanswered || []);
      setTickets(ticketsRes.tickets || []);
    } catch (e) {
      console.error('Failed to load admin data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleResolveUnanswered = async (item, action) => {
    try {
      await api.resolveUnanswered(item.id, action);
      fetchDashboardData();
    } catch (e) {
      console.error(e);
    }
  };

  const handleSaveFaqResolution = async (e) => {
    e.preventDefault();
    if (!resolveItem || !resolveAnswer.trim()) return;

    try {
      await api.addRawText(resolveItem.query, resolveAnswer);
      await api.resolveUnanswered(resolveItem.id, 'resolved_kb');
      setResolveItem(null);
      setResolveAnswer('');
      fetchDashboardData();
      alert('Answer indexed into Knowledge Base! The chatbot will now accurately answer this query.');
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTicket = async (ticketId, updates) => {
    try {
      const res = await api.updateTicket(ticketId, updates);
      if (res.ticket) {
        setSelectedTicket(res.ticket);
        fetchDashboardData();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddAgentNote = async (e) => {
    e.preventDefault();
    if (!selectedTicket || !agentNote.trim()) return;

    await handleUpdateTicket(selectedTicket.ticket_id, {
      add_note: agentNote.trim(),
      note_author: 'Admin Specialist'
    });
    setAgentNote('');
  };

  const telemetry = analytics?.telemetry || {
    total_queries: 0,
    deflected_queries: 0,
    deflection_rate_pct: 100,
    escalated_queries: 0,
    low_confidence_queries: 0,
    unresolved_gaps: 0
  };

  return (
    <div className="admin-container animate-fade-in">
      {/* Analytics KPI Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card glass-card">
          <div className="metric-header">
            <span className="metric-title">AI Deflection Rate</span>
            <span className="badge badge-success">Target: &gt;80%</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{telemetry.deflection_rate_pct}%</span>
            <span className="metric-subtext">{telemetry.deflected_queries} of {telemetry.total_queries} queries resolved</span>
          </div>
          <div className="progress-bar-wrap">
            <div className="progress-bar-fill" style={{ width: `${Math.min(100, telemetry.deflection_rate_pct)}%` }}></div>
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-header">
            <span className="metric-title">Total Inquiries</span>
            <BarChart3 size={18} className="text-purple" />
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{telemetry.total_queries}</span>
            <span className="metric-subtext">Across customer sessions</span>
          </div>
          <span className="metric-footer-tag text-purple">Avg Grounding Confidence: {telemetry.avg_confidence_pct || 88}%</span>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-header">
            <span className="metric-title">Knowledge Gaps</span>
            <span className="badge badge-warning">Action Needed</span>
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{telemetry.unresolved_gaps}</span>
            <span className="metric-subtext">Unanswered questions</span>
          </div>
          <span className="metric-footer-tag text-warning">Queries triggering strict fallback</span>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-header">
            <span className="metric-title">Human Escalations</span>
            <Ticket size={18} className="text-info" />
          </div>
          <div className="metric-value-row">
            <span className="metric-number">{tickets.filter(t => t.status !== 'resolved').length}</span>
            <span className="metric-subtext">Active escalation tickets</span>
          </div>
          <span className="metric-footer-tag text-info">{tickets.length} total tickets created</span>
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="admin-tabs-bar glass-panel">
        <div className="admin-tabs-list">
          <button 
            className={`admin-tab-btn ${activeTab === 'unanswered' ? 'active' : ''}`}
            onClick={() => setActiveTab('unanswered')}
          >
            <HelpCircle size={16} />
            <span>Unanswered Questions & Gaps</span>
            {unanswered.filter(u => u.status === 'unresolved').length > 0 && (
              <span className="badge badge-warning tab-count">
                {unanswered.filter(u => u.status === 'unresolved').length}
              </span>
            )}
          </button>

          <button 
            className={`admin-tab-btn ${activeTab === 'kb' ? 'active' : ''}`}
            onClick={() => setActiveTab('kb')}
          >
            <Database size={16} />
            <span>Knowledge Base Manager</span>
          </button>

          <button 
            className={`admin-tab-btn ${activeTab === 'tickets' ? 'active' : ''}`}
            onClick={() => setActiveTab('tickets')}
          >
            <Ticket size={16} />
            <span>Support Tickets Queue</span>
            {tickets.filter(t => t.status === 'open').length > 0 && (
              <span className="badge badge-info tab-count">
                {tickets.filter(t => t.status === 'open').length}
              </span>
            )}
          </button>
        </div>

        <button className="btn btn-secondary btn-sm" onClick={fetchDashboardData}>
          <RefreshCw size={13} className={loading ? 'spin' : ''} />
          <span>Refresh Telemetry</span>
        </button>
      </div>

      {/* Tab 1: Unanswered Questions & Gaps */}
      {activeTab === 'unanswered' && (
        <div className="admin-tab-content glass-panel animate-fade-in">
          <div className="tab-section-header">
            <div>
              <h3 className="tab-title">Unanswered Queries & Knowledge Gaps</h3>
              <p className="tab-subtitle">
                Questions that fell below the similarity threshold or triggered strict anti-hallucination. Click "Add to Knowledge Base" to instantly resolve the gap.
              </p>
            </div>
          </div>

          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer Query</th>
                  <th>Frequency</th>
                  <th>Grounding Confidence</th>
                  <th>Last Inquired</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {unanswered.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="empty-cell">
                      <CheckCircle2 size={24} className="text-success" />
                      <p>No unanswered queries logged! The Knowledge Base is currently answering all customer inquiries.</p>
                    </td>
                  </tr>
                ) : (
                  unanswered.map((item) => (
                    <tr key={item.id} className={item.status === 'resolved_kb' ? 'row-resolved' : ''}>
                      <td className="query-text-cell">
                        <strong>"{item.query}"</strong>
                      </td>
                      <td>
                        <span className="frequency-badge">{item.frequency}x</span>
                      </td>
                      <td>
                        <span className="badge badge-warning">
                          {Math.round((item.confidence || 0) * 100)}% match
                        </span>
                      </td>
                      <td>{new Date(item.last_asked).toLocaleString()}</td>
                      <td>
                        {item.status === 'resolved_kb' ? (
                          <span className="badge badge-success">Added to KB</span>
                        ) : item.status === 'resolved_ignored' ? (
                          <span className="badge badge-secondary">Ignored</span>
                        ) : (
                          <span className="badge badge-warning">Pending Review</span>
                        )}
                      </td>
                      <td className="text-right">
                        {item.status === 'unresolved' ? (
                          <div className="row-actions">
                            <button 
                              className="btn btn-primary btn-sm"
                              onClick={() => {
                                setResolveItem(item);
                                setResolveAnswer('');
                              }}
                              title="Index answer for this question"
                            >
                              <Plus size={13} />
                              <span>Add to KB</span>
                            </button>
                            <button 
                              className="btn btn-outline btn-sm"
                              onClick={() => handleResolveUnanswered(item, 'resolved_ignored')}
                              title="Ignore this question"
                            >
                              Dismiss
                            </button>
                          </div>
                        ) : (
                          <span className="resolved-tag">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Knowledge Base Manager */}
      {activeTab === 'kb' && (
        <KnowledgeBaseManager onDocumentsChanged={fetchDashboardData} />
      )}

      {/* Tab 3: Support Tickets Queue */}
      {activeTab === 'tickets' && (
        <div className="admin-tab-content glass-panel animate-fade-in">
          <div className="tab-section-header">
            <div>
              <h3 className="tab-title">Human Escalation Tickets</h3>
              <p className="tab-subtitle">
                Support cases escalated from the AI Chatbot with complete multi-turn conversation transcripts.
              </p>
            </div>
          </div>

          <div className="tickets-grid">
            {tickets.length === 0 ? (
              <div className="empty-tickets glass-card">
                <Ticket size={32} className="text-muted" />
                <p>No human support tickets created yet.</p>
              </div>
            ) : (
              tickets.map((t) => (
                <div 
                  key={t.ticket_id} 
                  className={`ticket-card glass-card priority-${t.priority}`}
                  onClick={() => setSelectedTicket(t)}
                >
                  <div className="ticket-card-header">
                    <span className="ticket-card-id">{t.ticket_id}</span>
                    <div className="ticket-badges">
                      <span className={`badge badge-${t.priority === 'urgent' ? 'danger' : t.priority === 'high' ? 'warning' : 'info'}`}>
                        {t.priority.toUpperCase()}
                      </span>
                      <span className={`badge badge-${t.status === 'open' ? 'warning' : t.status === 'in_progress' ? 'info' : 'success'}`}>
                        {t.status.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>

                  <h4 className="ticket-subject">{t.subject}</h4>
                  <p className="ticket-message-preview">{t.message}</p>

                  <div className="ticket-card-footer">
                    <div className="ticket-customer">
                      <User size={13} />
                      <span>{t.customer_name} ({t.customer_email})</span>
                    </div>
                    <span className="ticket-date">{new Date(t.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Quick Add KB Modal from Unanswered Question */}
      {resolveItem && (
        <div className="modal-backdrop" onClick={() => setResolveItem(null)}>
          <div className="resolve-modal glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="resolve-header">
              <Sparkles size={20} className="text-purple" />
              <div>
                <h3 className="resolve-title">Add Answer to Knowledge Base</h3>
                <span className="resolve-subtitle">Resolving knowledge gap for customer query</span>
              </div>
            </div>

            <form onSubmit={handleSaveFaqResolution} className="resolve-form">
              <div className="form-group">
                <label className="form-label">Customer Query</label>
                <input 
                  type="text" 
                  className="input-field" 
                  value={resolveItem.query} 
                  readOnly 
                />
              </div>

              <div className="form-group">
                <label className="form-label">Verified Official Answer *</label>
                <textarea 
                  className="input-field" 
                  rows="4"
                  placeholder="Enter the official answer or policy text to index into the vector store..."
                  value={resolveAnswer}
                  onChange={(e) => setResolveAnswer(e.target.value)}
                  required
                ></textarea>
              </div>

              <div className="resolve-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setResolveItem(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={!resolveAnswer.trim()}>
                  Index & Resolve Gap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ticket Details & History Modal */}
      {selectedTicket && (
        <div className="modal-backdrop" onClick={() => setSelectedTicket(null)}>
          <div className="ticket-detail-modal glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="ticket-detail-header">
              <div>
                <div className="ticket-modal-title-row">
                  <span className="ticket-modal-id">{selectedTicket.ticket_id}</span>
                  <h3 className="ticket-modal-subject">{selectedTicket.subject}</h3>
                </div>
                <p className="ticket-modal-meta">
                  Customer: <strong>{selectedTicket.customer_name}</strong> &lt;{selectedTicket.customer_email}&gt; | Category: {selectedTicket.category}
                </p>
              </div>

              <div className="ticket-modal-status-select">
                <label>Status:</label>
                <select 
                  className="input-field select-sm"
                  value={selectedTicket.status}
                  onChange={(e) => handleUpdateTicket(selectedTicket.ticket_id, { status: e.target.value })}
                >
                  <option value="open">OPEN</option>
                  <option value="in_progress">IN PROGRESS</option>
                  <option value="resolved">RESOLVED</option>
                </select>
              </div>
            </div>

            <div className="ticket-detail-body">
              {/* Attached Conversation Transcript */}
              <div className="transcript-section">
                <div className="transcript-header">
                  <MessageSquare size={14} className="text-purple" />
                  <span>Transferred AI Chat Transcript ({selectedTicket.conversation_history?.length || 0} messages)</span>
                </div>
                <div className="transcript-scroll">
                  {(!selectedTicket.conversation_history || selectedTicket.conversation_history.length === 0) ? (
                    <div className="empty-transcript">No previous chat transcript available for this ticket.</div>
                  ) : (
                    selectedTicket.conversation_history.map((m, idx) => (
                      <div key={idx} className={`transcript-bubble ${m.role}`}>
                        <div className="transcript-role">{m.role === 'user' ? 'Customer' : 'DocuSupport Bot'}:</div>
                        <div className="transcript-text">{m.content}</div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Internal Agent Notes */}
              <div className="agent-notes-section">
                <h4 className="notes-heading">Internal Engineering Notes</h4>
                <div className="notes-list">
                  {selectedTicket.agent_notes?.length === 0 ? (
                    <span className="no-notes-text">No notes added yet.</span>
                  ) : (
                    selectedTicket.agent_notes?.map((n, idx) => (
                      <div key={idx} className="note-card glass-card">
                        <div className="note-meta">
                          <strong>{n.author}</strong> • {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                        <p className="note-text">{n.note}</p>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleAddAgentNote} className="add-note-form">
                  <input 
                    type="text" 
                    className="input-field" 
                    placeholder="Add internal note..."
                    value={agentNote}
                    onChange={(e) => setAgentNote(e.target.value)}
                  />
                  <button type="submit" className="btn btn-secondary btn-sm" disabled={!agentNote.trim()}>
                    Add Note
                  </button>
                </form>
              </div>
            </div>

            <div className="ticket-detail-footer">
              <button className="btn btn-secondary" onClick={() => setSelectedTicket(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
