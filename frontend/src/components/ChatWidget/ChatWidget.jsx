import React, { useState } from 'react';
import { 
  MessageSquare, 
  X, 
  Bot, 
  Send, 
  ShieldCheck, 
  ExternalLink,
  ChevronDown,
  Minimize2,
  Sparkles,
  Users
} from 'lucide-react';
import { api } from '../../services/api';
import './ChatWidget.css';

export default function ChatWidget({ onOpenHandoff, onSelectCitation }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'w_init',
      role: 'assistant',
      content: 'Hi there! 👋 How can I help you today with ApexCloud services, pricing, or technical questions?',
      timestamp: 'Now',
      citations: []
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || loading) return;

    const userText = input;
    setInput('');
    const userMsg = {
      id: `w_u_${Date.now()}`,
      role: 'user',
      content: userText,
      timestamp: 'Just now'
    };
    setMessages(prev => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await api.sendMessage(userText, 'widget_session');
      const botMsg = {
        id: `w_b_${Date.now()}`,
        role: 'assistant',
        content: res.answer,
        citations: res.citations || [],
        is_fallback: res.is_fallback,
        suggest_handoff: res.suggest_handoff,
        timestamp: 'Just now'
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `w_err_${Date.now()}`,
          role: 'assistant',
          content: 'Sorry, could not connect to support service.',
          timestamp: 'Just now',
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="widget-wrapper">
      {/* Floating Launcher Button */}
      {!isOpen && (
        <button 
          className="widget-launcher-btn"
          onClick={() => setIsOpen(true)}
          title="Open Customer Support Assistant"
        >
          <div className="launcher-icon-wrap">
            <Bot size={26} />
            <div className="launcher-pulse"></div>
          </div>
          <span className="launcher-label">Need Help? Chat with AI</span>
        </button>
      )}

      {/* Floating Chat Popover Window */}
      {isOpen && (
        <div className="widget-window glass-panel animate-fade-in">
          {/* Header */}
          <div className="widget-header">
            <div className="widget-header-brand">
              <div className="widget-avatar">
                <Bot size={18} />
              </div>
              <div>
                <h4 className="widget-title">DocuSupport AI</h4>
                <div className="widget-status">
                  <span className="widget-status-dot"></span>
                  <span>Grounded Knowledge Assistant</span>
                </div>
              </div>
            </div>

            <div className="widget-header-actions">
              <button 
                className="widget-icon-btn" 
                onClick={() => setIsOpen(false)}
                title="Minimize chat"
              >
                <Minimize2 size={16} />
              </button>
              <button 
                className="widget-icon-btn" 
                onClick={() => setIsOpen(false)}
                title="Close chat"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Messages Body */}
          <div className="widget-messages">
            {messages.map((m) => (
              <div key={m.id} className={`widget-msg-row ${m.role}`}>
                <div className="widget-msg-bubble">
                  <p>{m.content}</p>
                  
                  {m.citations && m.citations.length > 0 && (
                    <div className="widget-citations">
                      {m.citations.slice(0, 2).map((c, i) => (
                        <button 
                          key={i} 
                          className="widget-cit-chip"
                          onClick={() => onSelectCitation && onSelectCitation(c)}
                        >
                          <span>{c.doc_name}</span>
                          <ExternalLink size={10} />
                        </button>
                      ))}
                    </div>
                  )}

                  {m.suggest_handoff && (
                    <button 
                      className="btn btn-primary btn-sm widget-handoff-btn"
                      onClick={() => onOpenHandoff && onOpenHandoff(messages)}
                    >
                      <Users size={12} />
                      <span>Connect with Human</span>
                    </button>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div className="widget-msg-row assistant">
                <div className="widget-msg-bubble widget-loading">
                  <span>Searching docs...</span>
                </div>
              </div>
            )}
          </div>

          {/* Input Footer */}
          <form onSubmit={handleSend} className="widget-footer">
            <input 
              type="text" 
              className="input-field widget-input" 
              placeholder="Ask a question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
            />
            <button 
              type="submit" 
              className="btn btn-primary widget-send-btn" 
              disabled={!input.trim() || loading}
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
