// Fix for Node.js environment dependencies in browser context
// This polyfill handles various Node.js features that Google SDK and other libraries expect

if (typeof window !== 'undefined') {
  // Only run in browser environment
  if (typeof process === 'undefined') {
    (window as any).process = {};
  }
  
  const proc = (window as any).process;
  
  // Polyfill stdout/stderr for TTY checks
  if (!proc.stdout) {
    proc.stdout = {
      isTTY: false,
      write: () => {},
      columns: 80
    };
  }
  
  if (!proc.stderr) {
    proc.stderr = {
      isTTY: false,
      write: () => {}
    };
  }
  
  // Polyfill environment variables used by Google SDK
  if (!proc.env) {
    proc.env = {};
  }
  
  // Add specific Google SDK environment variables
  Object.assign(proc.env, {
    GOOGLE_SDK_NODE_LOGGING: false,
    NODE_ENV: 'production', // This can help avoid development-specific behaviors
    DEBUG: '', // Empty debug string to avoid verbose logging
    // Add other environment variables as needed
  });
  
  // Polyfill Google Auth Library browser detection
  // Sometimes Google's libraries check for browser environment incorrectly
  if (typeof global === 'undefined') {
    (window as any).global = window;
  }
}

export default {};
