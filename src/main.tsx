import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import { initEnvValidation } from './lib/env-validator'
import { enableSecureConsoleInDevelopment } from './lib/secure-logger'

// Run security validation on startup
initEnvValidation();

// Enable secure console logging in development
enableSecureConsoleInDevelopment();

// Initialize the application
createRoot(document.getElementById("root")!).render(<App />);
