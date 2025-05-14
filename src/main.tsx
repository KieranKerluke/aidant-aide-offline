// Import the Google API patch first to fix GOOGLE_SDK_NODE_LOGGING error
import './google-api-patch.js';

// Process polyfill is now handled directly in index.html

import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { initEnvValidation } from './lib/env-validator';
import { enableSecureConsoleInDevelopment } from './lib/secure-logger';
import ErrorBoundary from './components/ErrorBoundary';

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
