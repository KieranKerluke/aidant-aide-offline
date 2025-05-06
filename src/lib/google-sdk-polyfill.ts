/**
 * Google SDK Browser Polyfill
 * 
 * This file provides necessary polyfills and environment variables
 * to make Google's Node.js-oriented SDKs work in browser environments.
 */

// Ensure global is defined
if (typeof window !== 'undefined' && typeof global === 'undefined') {
  (window as any).global = window;
}

// Polyfill process for Google SDK
if (typeof window !== 'undefined') {
  if (typeof (window as any).process === 'undefined') {
    (window as any).process = {};
  }
  
  const proc = (window as any).process;
  
  // Add environment
  if (!proc.env) {
    proc.env = {};
  }
  
  // Specific Google SDK environment variables
  proc.env.GOOGLE_SDK_NODE_LOGGING = false;
  proc.env.DEBUG = '';
  proc.env.NODE_ENV = 'production';
  
  // Stub out TTY interface
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
}

// Disable Node.js module resolution for browser
if (typeof window !== 'undefined' && !(window as any).require) {
  (window as any).require = function() {
    throw new Error('Node.js require is not supported in the browser');
  };
}

export default {};
