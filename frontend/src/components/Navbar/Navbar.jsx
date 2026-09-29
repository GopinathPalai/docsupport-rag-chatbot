import React, { useState } from 'react';
import { 
  Bot, 
  MessageSquare, 
  BarChart3, 
  Cpu, 
  Sparkles, 
  Key, 
  ExternalLink,
  Layers,
  Settings
} from 'lucide-react';
import './Navbar.css';

export default function Navbar({ 
  currentView, 
  setCurrentView, 
  isWidgetMode, 
  setIsWidgetMode,
  serverStatus,
  config,
  onOpenConfigModal
}) {
  return (
    <header className="navbar-container glass-panel">
      <div className="navbar-brand">
        <div className="brand-logo">
          <Bot size={22} className="logo-icon" />
          <div className="logo-pulse"></div>
        </div>
        <div className="brand-info">
          <div className="brand-title-wrap">
            <span className="brand-name">DocuSupport</span>
            <span className="badge badge-purple brand-badge">RAG AI</span>
          </div>
          <span className="brand-subtitle">Grounded Customer Support Agent</span>
        </div>
      </div>

      <nav className="navbar-nav">
        <button 
          className={`nav-item ${currentView === 'chat' && !isWidgetMode ? 'active' : ''}`}
          onClick={() => { setCurrentView('chat'); setIsWidgetMode(false); }}
        >
          <MessageSquare size={16} />
          <span>Support Portal</span>
        </button>

        <button 
          className={`nav-item ${currentView === 'admin' ? 'active' : ''}`}
          onClick={() => { setCurrentView('admin'); setIsWidgetMode(false); }}
        >
          <BarChart3 size={16} />
          <span>Admin & Analytics</span>
        </button>

        <button 
          className={`nav-item ${currentView === 'architecture' ? 'active' : ''}`}
          onClick={() => { setCurrentView('architecture'); setIsWidgetMode(false); }}
        >
          <Cpu size={16} />
          <span>RAG Pipeline</span>
        </button>

        <button 
          className={`nav-item widget-toggle ${isWidgetMode ? 'active' : ''}`}
          onClick={() => setIsWidgetMode(!isWidgetMode)}
          title="Preview chatbot as an embeddable website widget"
        >
          <Layers size={16} />
          <span>{isWidgetMode ? 'Exit Demo Site' : 'Embed Widget Demo'}</span>
          <span className="badge badge-info nav-pill">Stretch Goal</span>
        </button>
      </nav>

      <div className="navbar-actions">
        <div className="status-indicator" title="Backend Server Status">
          <span className={`status-dot ${serverStatus === 'online' ? 'online' : 'offline'}`}></span>
          <span className="status-text">{serverStatus === 'online' ? 'API Connected' : 'Connecting...'}</span>
        </div>

        <button 
          className="btn btn-secondary btn-sm config-btn"
          onClick={onOpenConfigModal}
          title="Configure Gemini API & RAG Parameters"
        >
          <Key size={14} className={config?.has_gemini_key ? 'text-success' : 'text-warning'} />
          <span>{config?.has_gemini_key ? 'Gemini 2.5 Active' : 'Configure AI'}</span>
          <Settings size={13} className="settings-icon" />
        </button>
      </div>
    </header>
  );
}
