import React, { useState } from 'react';
import { 
  Users, 
  X, 
  Send, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  ShieldCheck,
  MessageSquare
} from 'lucide-react';
import { api } from '../../services/api';
import './HumanHandoffModal.css';

export default function HumanHandoffModal({ isOpen, onClose, sessionId, chatHistory, onTicketCreated }) {
  const [formData, setFormData] = useState({
    customer_name: '',
    customer_email: '',
    priority: 'medium',
    category: 'Technical Support',
    subject: 'Escalation from AI Support Session',
    message: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.customer_email || !formData.customer_name) {
      setError('Please provide both your name and email address.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        ...formData,
        session_id: sessionId,
        conversation_history: chatHistory || []
      };
      const res = await api.createTicket(payload);
      if (res.ticket) {
        setCreatedTicket(res.ticket);
        if (onTicketCreated) onTicketCreated(res.ticket);
      } else {
        setError(res.error || 'Failed to create support ticket');
      }
    } catch (err) {
      setError('Network error while creating ticket');
    } finally {
      setSubmitting(false);
    }
  };

  const handleResetAndClose = () => {
    setCreatedTicket(null);
    setError('');
    onClose();
  };

  return (
    <div className="handoff-backdrop" onClick={handleResetAndClose}>
      <div className="handoff-modal glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
        <div className="handoff-header">
          <div className="handoff-header-left">
            <div className="handoff-icon-wrap">
              <Users size={20} className="text-purple" />
            </div>
            <div>
              <h3 className="handoff-title">Connect with Human Support Agent</h3>
              <p className="handoff-subtitle">Tier 2 Technical Support & Engineering Escalation</p>
            </div>
          </div>
          <button className="btn-close" onClick={handleResetAndClose}>
            <X size={18} />
          </button>
        </div>

        {createdTicket ? (
          <div className="ticket-success-view">
            <div className="success-icon-wrap">
              <CheckCircle size={48} className="text-success" />
            </div>
            <h4 className="success-title">Escalation Ticket Created!</h4>
            <div className="ticket-id-badge">
              <span>Ticket ID:</span>
              <strong>{createdTicket.ticket_id}</strong>
            </div>
            <p className="success-desc">
              Your issue has been assigned to our Support Engineering team.
              We have dispatched a confirmation email to <strong>{createdTicket.customer_email}</strong>.
            </p>

            <div className="sla-notice glass-card">
              <Clock size={16} className="text-info" />
              <div>
                <strong>Guaranteed SLA Response Time:</strong>
                <span> {createdTicket.priority === 'urgent' ? 'Under 15 minutes' : 'Within 2 hours'}</span>
              </div>
            </div>

            <div className="history-transferred-tag">
              <ShieldCheck size={14} className="text-success" />
              <span>Full chat history ({chatHistory?.length || 0} messages) securely transmitted to the assigned agent.</span>
            </div>

            <button className="btn btn-primary btn-block" onClick={handleResetAndClose}>
              Return to Chat
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="handoff-form">
            {error && (
              <div className="form-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-notice">
              <MessageSquare size={14} className="text-info" />
              <span>
                Your conversation transcript will be automatically attached so our human agent has full context without you having to repeat yourself.
              </span>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <input 
                  type="text" 
                  className="input-field" 
                  placeholder="e.g. Alex Morgan"
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Work Email *</label>
                <input 
                  type="email" 
                  className="input-field" 
                  placeholder="alex@company.com"
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="form-row-2">
              <div className="form-group">
                <label className="form-label">Category</label>
                <select 
                  className="input-field"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="Technical Support">Technical Support & API</option>
                  <option value="Billing & Pricing">Billing, Pricing & Refunds</option>
                  <option value="Enterprise SLA">Enterprise Contract & SLA</option>
                  <option value="General Inquiry">General Inquiry</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Priority</label>
                <select 
                  className="input-field"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">Low (General guidance)</option>
                  <option value="medium">Medium (Standard priority)</option>
                  <option value="high">High (Production impaired)</option>
                  <option value="urgent">Urgent (Critical system outage)</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Subject</label>
              <input 
                type="text" 
                className="input-field" 
                placeholder="Brief summary of request"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>

            <div className="form-group">
              <label className="form-label">Additional Details / Context</label>
              <textarea 
                className="input-field textarea-field" 
                rows="3"
                placeholder="Provide any additional details or requirements for the support engineer..."
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              ></textarea>
            </div>

            <div className="handoff-actions">
              <button type="button" className="btn btn-secondary" onClick={handleResetAndClose}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                <Send size={15} />
                <span>{submitting ? 'Submitting Ticket...' : 'Create Priority Ticket'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
