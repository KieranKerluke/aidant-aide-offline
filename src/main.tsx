// Fix Google SDK issues first by running this inline script
(() => {
  // Inject a script element that runs before any module loading
  const script = document.createElement('script');
  script.textContent = `
    // Early polyfill for Google SDK
    window.process = window.process || {};
    window.process.env = window.process.env || {};
    window.process.env.GOOGLE_SDK_NODE_LOGGING = false;
    window.process.env.NODE_ENV = 'production';
    window.process.stdout = window.process.stdout || { isTTY: false, write: function() {} };
    window.process.stderr = window.process.stderr || { isTTY: false, write: function() {} };
    window.global = window;
  `;
  document.head.prepend(script);
})();

// Import process polyfill for other Node.js features
import './process-polyfill'

import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initEnvValidation } from './lib/env-validator'
import { enableSecureConsoleInDevelopment } from './lib/secure-logger'
import ErrorBoundary from './components/ErrorBoundary'

// Run security validation on startup
initEnvValidation();

// Enable secure console logging in development
enableSecureConsoleInDevelopment();

// Setup error handling
window.addEventListener('error', (event) => {
  console.error('Global error caught:', event.error);
});

// Initialize the application with error boundary
createRoot(document.getElementById("root")!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
