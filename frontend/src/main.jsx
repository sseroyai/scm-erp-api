import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import './i18n';

const originalFetch = window.fetch;
window.fetch = async (...args) => {
  let [resource, config] = args;
  if (typeof resource === 'string' && resource.startsWith('/api/')) {
    config = config || {};
    config.headers = config.headers || {};
    try {
      const stored = localStorage.getItem('erp_auth');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.currentRole) {
          config.headers['X-User-Role'] = parsed.currentRole;
        }
      }
    } catch (e) {}
  }
  return originalFetch(resource, config);
};

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
