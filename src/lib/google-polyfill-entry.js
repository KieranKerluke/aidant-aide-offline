// This file will be the first module loaded to ensure Google SDK polyfills run first
// Do not use TypeScript here to ensure it loads as early as possible
(function() {
  // Ensure process and process.env exist
  if (typeof window !== 'undefined') {
    // Define process if not exists
    if (!window.process) window.process = {};
    
    // Define env if not exists
    if (!window.process.env) window.process.env = {};
    
    // Set all required Node.js environment variables
    Object.assign(window.process.env, {
      GOOGLE_SDK_NODE_LOGGING: false,
      NODE_ENV: 'production',
      DEBUG: '',
    });
    
    // Ensure stdout and stderr with isTTY exist
    if (!window.process.stdout) {
      window.process.stdout = {
        isTTY: false,
        write: function() {},
        columns: 80
      };
    }
    
    if (!window.process.stderr) {
      window.process.stderr = {
        isTTY: false,
        write: function() {}
      };
    }
    
    // Ensure global exists and points to window
    if (typeof window.global === 'undefined') {
      window.global = window;
    }
  }
  
  // Log successful polyfill
  console.log('Google SDK polyfill initialized successfully');
})();
