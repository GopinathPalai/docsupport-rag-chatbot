import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, 
  Bot, 
  User, 
  Trash2, 
  Sparkles, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Users, 
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { api } from '../../services/api';
import './ChatWindow.css';

const SAMPLE_PROMPTS = [
  { label: '💰 Pro Tier Pricing', query: 'How much does the Pro tier cost and what is included?' },
  { label: '🔄 30-Day Refund Policy', query: 'What is your refund policy for annual subscriptions?' },
  { label: '⚡ Enterprise SLA & Uptime', query: 'What is the uptime guarantee and SLA credit schedule for Enterprise?' },
  { label: '🚫 Test Fallback (Submarine)', query: 'Can I rent a submarine or yacht in the Bahamas?' },
  { label: '👤 Escalate to Human', query: 'I want to speak with a human support specialist' }
];

export default function ChatWindow({ 
  sessionId, 
  onSelectCitation, 
  onOpenHandoff,
  onSessionUpdated
}) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // Initial greeting if empty
    setMessages([
      {
        id: 'initial',
        role: 'assistant',
        content: "Hello! I am **DocuSupport AI**, the official virtual support assistant for ApexCloud. I can provide accurate answers directly grounded in our verified product documentation, pricing catalogs, SLAs, and security guides.\n\nHow can I help you today?",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        citations: []
      }
    ]);
  }, [sessionId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSend = async (queryText = null) => {
    const textToSend = queryText || input;
    if (!textToSend.trim() || loading) return;

    const userMsg = {
      id: `u_${Date.now()}`,
      role: 'user',
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMsg]);
    if (!queryText) setInput('');
    setLoading(true);

    try {
      const response = await api.sendMessage(textToSend, sessionId);
      
      const botMsg = {
        id: `b_${Date.now()}`,
        role: 'assistant',
        content: response.answer || "I apologize, but I could not generate a response.",
        citations: response.citations || [],
        confidence_score: response.confidence_score,
        is_fallback: response.is_fallback,
        suggest_handoff: response.suggest_handoff,
        hand_off_requested: response.hand_off_requested,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, botMsg]);
      if (onSessionUpdated) onSessionUpdated();
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err_${Date.now()}`,
          role: 'assistant',
          content: "Sorry, I encountered a communication error with the backend server. Please verify the backend is running.",
          is_fallback: true,
          suggest_handoff: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citations: []
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    try {
      await api.clearSession(sessionId);
      setMessages([
        {
          id: 'cleared',
          role: 'assistant',
          content: "Conversation history has been cleared. What would you like to ask about ApexCloud?",
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          citations: []
        }
      ]);
    } catch (e) {
      console.error(e);
    }
  };

  // Helper to format basic markdown (bold, links, code)
  const renderFormattedText = (text) => {
    if (!text) return null;
    
    // Split by newlines
    const paragraphs = text.split('\n\n');
    return paragraphs.map((para, pIdx) => {
      // Check for bullet lists
      if (para.includes('\n* ') || para.startsWith('* ') || para.includes('\n- ') || para.startsWith('- ')) {
        const lines = para.split('\n');
        return (
          <ul key={pIdx} className="message-list">
            {lines.map((line, lIdx) => {
              const clean = line.replace(/^[\*\-]\s+/, '');
              return <li key={lIdx} dangerouslySetInnerHTML={{ __html: formatInline(clean) }}></li>;
            })}
          </ul>
        );
      }
      return (
        <p key={pIdx} className="message-para" dangerouslySetInnerHTML={{ __html: formatInline(para) }} />
      );
    });
  };

  const formatInline = (str) => {
    return str
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/`([^`]+)`/g, '<code>$1</code>');
  };

  return (
    <div className="chat-window-container glass-panel">
      {/* Chat Window Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="bot-avatar-header">
            <Bot size={20} />
          </div>
          <div>
            <div className="chat-title-row">
              <h2 className="chat-title">ApexCloud Customer Support</h2>
              <span className="badge badge-success">
                <ShieldCheck size={12} />
                <span>RAG Verified Grounding</span>
              </span>
            </div>
            <span className="chat-session-text">Session: <code>{sessionId}</code></span>
          </div>
        </div>

        <div className="chat-header-actions">
          <button 
            className="btn btn-outline btn-sm"
            onClick={() => onOpenHandoff(messages)}
            title="Escalate directly to a human support agent"
          >
            <Users size={14} className="text-purple" />
            <span>Human Agent</span>
          </button>

          <button 
            className="btn btn-secondary btn-sm"
            onClick={handleClearChat}
            title="Reset conversation session"
          >
            <Trash2 size={14} />
            <span>Clear</span>
          </button>
        </div>
      </div>

      {/* Suggested Quick Prompts */}
      <div className="suggested-prompts-bar">
        <span className="prompt-lead">
          <Sparkles size={13} className="text-purple" />
          <span>Quick test prompts:</span>
        </span>
        <div className="prompts-scroll">
          {SAMPLE_PROMPTS.map((p, idx) => (
            <button 
              key={idx}
              className="prompt-chip"
              onClick={() => handleSend(p.query)}
              disabled={loading}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Message Thread */}
      <div className="messages-thread">
        {messages.map((msg) => (
          <div key={msg.id} className={`message-row ${msg.role === 'user' ? 'message-user' : 'message-bot'}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>

            <div className="message-content-wrapper">
              <div className="message-bubble glass-card">
                {/* Bot Confidence Tag */}
                {msg.role === 'assistant' && msg.confidence_score !== undefined && (
                  <div className="message-grounding-tag">
                    {msg.is_fallback ? (
                      <span className="badge badge-warning">
                        <AlertTriangle size={12} />
                        <span>Strict Fallback Triggered</span>
                      </span>
                    ) : (
                      <span className="badge badge-purple">
                        <CheckCircle2 size={12} />
                        <span>{Math.round(msg.confidence_score * 100)}% Document Grounding Match</span>
                      </span>
                    )}
                  </div>
                )}

                <div className="message-text">
                  {renderFormattedText(msg.content)}
                </div>

                {/* Citations Chips */}
                {msg.citations && msg.citations.length > 0 && (
                  <div className="citations-block">
                    <span className="citations-label">
                      <FileText size={12} />
                      <span>Verified Sources & Citations:</span>
                    </span>
                    <div className="citations-chips-wrap">
                      {msg.citations.map((cit, cIdx) => (
                        <button 
                          key={cIdx}
                          className="citation-chip"
                          onClick={() => onSelectCitation(cit)}
                          title="Click to view full grounded excerpt"
                        >
                          <span className="citation-doc-name">{cit.doc_name}</span>
                          {cit.page_number && <span className="citation-page">p.{cit.page_number}</span>}
                          <span className="citation-pct">{Math.round((cit.similarity_score || 0.8) * 100)}%</span>
                          <ExternalLink size={10} className="citation-link-icon" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Fallback / Human Handoff Banner */}
                {msg.suggest_handoff && (
                  <div className="handoff-cta-banner">
                    <div className="handoff-cta-text">
                      <Users size={16} className="text-purple" />
                      <span>Would you like to connect with our Tier 2 Engineering Support?</span>
                    </div>
                    <button 
                      className="btn btn-primary btn-sm"
                      onClick={() => onOpenHandoff(messages)}
                    >
                      <span>Create Support Ticket</span>
                      <ArrowRight size={13} />
                    </button>
                  </div>
                )}
              </div>

              <span className="message-timestamp">{msg.timestamp}</span>
            </div>
          </div>
        ))}

        {loading && (
          <div className="message-row message-bot">
            <div className="message-avatar">
              <Bot size={18} />
            </div>
            <div className="message-bubble glass-card loading-bubble">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span className="loading-text">Searching indexed documents & synthesizing grounded answer...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      <div className="chat-input-container">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="chat-input-form">
          <input 
            type="text"
            className="input-field chat-text-input"
            placeholder="Ask anything about ApexCloud pricing, SLAs, APIs, refunds, or security..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
          />
          <button 
            type="submit" 
            className="btn btn-primary send-button"
            disabled={!input.trim() || loading}
          >
            <Send size={16} />
            <span>Send</span>
          </button>
        </form>
        <div className="input-footer-note">
          <ShieldCheck size={12} className="text-success" />
          <span>Answers are strictly grounded in indexed company documents. No hallucinations permitted.</span>
        </div>
      </div>
    </div>
  );
}
