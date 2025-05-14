// Import the process TTY fix first to ensure isTTY is properly defined
import './process-tty-fix.js';

// Import enhanced process polyfill for additional functionality
import './process-polyfill-fix';

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
