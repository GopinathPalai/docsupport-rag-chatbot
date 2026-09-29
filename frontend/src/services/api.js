const API_BASE = '/api';

export const api = {
  // Health & Config
  getHealth: async () => {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },
  getConfig: async () => {
    const res = await fetch(`${API_BASE}/config`);
    return res.json();
  },
  updateConfig: async (configData) => {
    const res = await fetch(`${API_BASE}/config`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(configData)
    });
    return res.json();
  },

  // Chat & Sessions
  sendMessage: async (message, sessionId = 'default') => {
    const res = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, session_id: sessionId })
    });
    return res.json();
  },
  getSessionHistory: async (sessionId = 'default') => {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`);
    return res.json();
  },
  clearSession: async (sessionId = 'default') => {
    const res = await fetch(`${API_BASE}/chat/sessions/${sessionId}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Knowledge Base & Documents
  getDocuments: async () => {
    const res = await fetch(`${API_BASE}/documents`);
    return res.json();
  },
  uploadDocument: async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/documents/upload`, {
      method: 'POST',
      body: formData
    });
    return res.json();
  },
  scrapeUrl: async (url) => {
    const res = await fetch(`${API_BASE}/documents/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url })
    });
    return res.json();
  },
  addRawText: async (title, text) => {
    const res = await fetch(`${API_BASE}/documents/text`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, text })
    });
    return res.json();
  },
  deleteDocument: async (docId) => {
    const res = await fetch(`${API_BASE}/documents/${docId}`, {
      method: 'DELETE'
    });
    return res.json();
  },
  getDocumentChunks: async (docId) => {
    const res = await fetch(`${API_BASE}/documents/${docId}/chunks`);
    return res.json();
  },

  // Human Handoff Tickets
  getTickets: async (status = '', priority = '') => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (priority) params.append('priority', priority);
    const res = await fetch(`${API_BASE}/tickets?${params.toString()}`);
    return res.json();
  },
  createTicket: async (ticketData) => {
    const res = await fetch(`${API_BASE}/tickets`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(ticketData)
    });
    return res.json();
  },
  updateTicket: async (ticketId, updates) => {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return res.json();
  },
  deleteTicket: async (ticketId) => {
    const res = await fetch(`${API_BASE}/tickets/${ticketId}`, {
      method: 'DELETE'
    });
    return res.json();
  },

  // Admin & Analytics
  getUnanswered: async (status = '') => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    const res = await fetch(`${API_BASE}/admin/unanswered?${params.toString()}`);
    return res.json();
  },
  resolveUnanswered: async (itemId, action = 'resolved_kb') => {
    const res = await fetch(`${API_BASE}/admin/unanswered/${itemId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action })
    });
    return res.json();
  },
  getAnalytics: async () => {
    const res = await fetch(`${API_BASE}/admin/analytics`);
    return res.json();
  },
  seedSampleDocs: async () => {
    const res = await fetch(`${API_BASE}/admin/seed`, {
      method: 'POST'
    });
    return res.json();
  }
};
