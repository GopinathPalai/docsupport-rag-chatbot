import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar/Navbar';
import ChatWindow from './components/ChatWindow/ChatWindow';
import AdminDashboard from './components/AdminDashboard/AdminDashboard';
import ArchitectureView from './components/ArchitectureView/ArchitectureView';
import ChatWidget from './components/ChatWidget/ChatWidget';
import CitationDrawer from './components/CitationDrawer/CitationDrawer';
import HumanHandoffModal from './components/HumanHandoffModal/HumanHandoffModal';
import { api } from './services/api';
import { 
  Key, 
  Sliders, 
  X, 
  Save, 
  ShieldCheck, 
  Cloud, 
  Cpu, 
  Lock, 
  Zap, 
  ArrowRight,
  ExternalLink,
  Bot
} from 'lucide-react';
import './App.css';

export default function App() {
  const [currentView, setCurrentView] = useState('chat'); // 'chat', 'admin', 'architecture'
  const [isWidgetMode, setIsWidgetMode] = useState(false);
  const [serverStatus, setServerStatus] = useState('connecting');
  const [config, setConfig] = useState(null);

  // Modals & Drawers
  const [selectedCitation, setSelectedCitation] = useState(null);
  const [isHandoffOpen, setIsHandoffOpen] = useState(false);
  const [handoffHistory, setHandoffHistory] = useState([]);
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false);

  // Config form state
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [modelSelect, setModelSelect] = useState('gemini-2.5-flash');
  const [thresholdInput, setThresholdInput] = useState(0.25);
  const [configSaving, setConfigSaving] = useState(false);

  // Active chat session
  const [sessionId, setSessionId] = useState('session_main');

  const checkHealthAndConfig = async () => {
    try {
      const health = await api.getHealth();
      if (health.status === 'online') {
        setServerStatus('online');
      }
      const cfg = await api.getConfig();
      setConfig(cfg);
      if (cfg) {
        setModelSelect(cfg.model_name || 'gemini-2.5-flash');
        setThresholdInput(cfg.similarity_threshold || 0.25);
      }
    } catch (err) {
      console.warn('Backend server not connected yet', err);
      setServerStatus('offline');
    }
  };

  useEffect(() => {
    checkHealthAndConfig();
    const interval = setInterval(checkHealthAndConfig, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSaveConfig = async (e) => {
    e.preventDefault();
    setConfigSaving(true);
    try {
      const res = await api.updateConfig({
        api_key: apiKeyInput || undefined,
        model_name: modelSelect,
        similarity_threshold: parseFloat(thresholdInput)
      });
      if (res.success) {
        setApiKeyInput('');
        setIsConfigModalOpen(false);
        checkHealthAndConfig();
        alert('Configuration saved! Gemini AI parameters updated successfully.');
      }
    } catch (err) {
      alert('Failed to update configuration.');
    } finally {
      setConfigSaving(false);
    }
  };

  const handleOpenHandoffWithHistory = (history) => {
    setHandoffHistory(history);
    setIsHandoffOpen(true);
  };

  return (
    <div className="app-layout">
      {/* Top Navbar */}
      <Navbar 
        currentView={currentView}
        setCurrentView={setCurrentView}
        isWidgetMode={isWidgetMode}
        setIsWidgetMode={setIsWidgetMode}
        serverStatus={serverStatus}
        config={config}
        onOpenConfigModal={() => setIsConfigModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="app-main-content">
        {isWidgetMode ? (
          /* Stretch Goal 1: Simulated Website Host with Embedded Widget */
          <div className="mock-website-container glass-panel animate-fade-in">
            <div className="mock-browser-bar">
              <div className="browser-dots">
                <span className="dot dot-red"></span>
                <span className="dot dot-yellow"></span>
                <span className="dot dot-green"></span>
              </div>
              <div className="browser-url-bar">
                <span>https://apexcloud.io/solutions/enterprise</span>
              </div>
              <span className="badge badge-info browser-badge">Live Embedded Widget Demo</span>
            </div>

            <div className="mock-site-content">
              <div className="mock-hero">
                <span className="badge badge-purple hero-pill">
                  <Cloud size={13} />
                  <span>ApexCloud Next-Gen Platform</span>
                </span>
                <h1 className="mock-hero-title">
                  Intelligent Cloud Collaboration for Modern Engineering Teams
                </h1>
                <p className="mock-hero-desc">
                  Accelerate your cloud workflows with 99.99% financially backed SLA, automated disaster recovery, and SOC 2 Type II enterprise security.
                </p>
                <div className="mock-hero-buttons">
                  <button className="btn btn-primary btn-lg">Start Free Trial</button>
                  <button className="btn btn-outline btn-lg">Explore API Docs</button>
                </div>
              </div>

              {/* Feature Cards Grid */}
              <div className="mock-features-grid">
                <div className="mock-feature-card glass-card">
                  <div className="feat-icon"><Cpu size={24} className="text-purple" /></div>
                  <h4>Global Cloud Infrastructure</h4>
                  <p>Distributed low-latency regions across US-East, US-West, EU-Central, and APAC Singapore.</p>
                </div>
                <div className="mock-feature-card glass-card">
                  <div className="feat-icon"><Lock size={24} className="text-success" /></div>
                  <h4>Bank-Grade Security</h4>
                  <p>AES-256 encryption at rest, enforced TLS 1.3 in transit, and SSO via SAML 2.0 / Okta.</p>
                </div>
                <div className="mock-feature-card glass-card">
                  <div className="feat-icon"><Zap size={24} className="text-warning" /></div>
                  <h4>99.99% Uptime SLA</h4>
                  <p>Financially backed credits, under 15-minute critical incident response, and continuous RPO &lt; 5m.</p>
                </div>
              </div>

              <div className="mock-widget-notice glass-card">
                <Bot size={20} className="text-purple" />
                <div>
                  <strong>Embeddable Website Chatbot Active:</strong>
                  <span> Look at the bottom-right corner! The DocuSupport AI widget is floating on this webpage. Click it to ask questions directly!</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* Standard Application Views */
          <>
            {currentView === 'chat' && (
              <ChatWindow 
                sessionId={sessionId}
                onSelectCitation={(cit) => setSelectedCitation(cit)}
                onOpenHandoff={handleOpenHandoffWithHistory}
              />
            )}

            {currentView === 'admin' && (
              <AdminDashboard />
            )}

            {currentView === 'architecture' && (
              <ArchitectureView />
            )}
          </>
        )}
      </main>

      {/* Stretch Goal 1: Floating Embeddable Chat Widget */}
      <ChatWidget 
        onSelectCitation={(cit) => setSelectedCitation(cit)}
        onOpenHandoff={handleOpenHandoffWithHistory}
      />

      {/* Citation Verification Modal / Drawer */}
      {selectedCitation && (
        <CitationDrawer 
          citation={selectedCitation}
          onClose={() => setSelectedCitation(null)}
        />
      )}

      {/* Human Support Handoff Modal */}
      <HumanHandoffModal 
        isOpen={isHandoffOpen}
        onClose={() => setIsHandoffOpen(false)}
        sessionId={sessionId}
        chatHistory={handoffHistory}
        onTicketCreated={(ticket) => {
          console.log('Ticket created:', ticket);
        }}
      />

      {/* System & Gemini API Key Settings Modal */}
      {isConfigModalOpen && (
        <div className="modal-backdrop" onClick={() => setIsConfigModalOpen(false)}>
          <div className="config-modal glass-panel animate-fade-in" onClick={(e) => e.stopPropagation()}>
            <div className="config-modal-header">
              <div className="config-title-row">
                <Key size={20} className="text-purple" />
                <div>
                  <h3 className="config-title">Google Gemini AI & RAG Settings</h3>
                  <span className="config-subtitle">Configure API keys, model parameters, and anti-hallucination gates</span>
                </div>
              </div>
              <button className="btn-close" onClick={() => setIsConfigModalOpen(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveConfig} className="config-form">
              <div className="form-group">
                <label className="form-label">Google Gemini API Key</label>
                <input 
                  type="password"
                  className="input-field"
                  placeholder={config?.has_gemini_key ? `Configured: ${config.masked_api_key}` : "Paste your Gemini API key (AIzaSy...)"}
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                />
                <span className="field-hint">
                  {config?.has_gemini_key ? (
                    <span className="text-success">✓ Gemini API key is currently active and verified.</span>
                  ) : (
                    <span>Running in high-performance local semantic mode. Enter key to enable Gemini 2.5 Flash dense generation.</span>
                  )}
                </span>
              </div>

              <div className="form-row-2">
                <div className="form-group">
                  <label className="form-label">LLM Model</label>
                  <select 
                    className="input-field"
                    value={modelSelect}
                    onChange={(e) => setModelSelect(e.target.value)}
                  >
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash (Ultra-fast & Recommended)</option>
                    <option value="gemini-1.5-flash">Gemini 1.5 Flash</option>
                    <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep reasoning)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Anti-Hallucination Threshold ({thresholdInput})</label>
                  <input 
                    type="range"
                    min="0.10"
                    max="0.80"
                    step="0.05"
                    className="range-input"
                    value={thresholdInput}
                    onChange={(e) => setThresholdInput(e.target.value)}
                  />
                  <span className="field-hint">Scores below this trigger strict fallback and human handoff.</span>
                </div>
              </div>

              <div className="config-info-box glass-card">
                <ShieldCheck size={16} className="text-success" />
                <span>
                  Strict Grounding Policy: The system will refuse to extrapolate or answer questions that are not explicitly documented in the knowledge base.
                </span>
              </div>

              <div className="config-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setIsConfigModalOpen(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={configSaving}>
                  <Save size={15} />
                  <span>{configSaving ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
