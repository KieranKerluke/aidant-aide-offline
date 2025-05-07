// Enhanced Process Polyfill for Node.js in Browser Environment
(function() {
  if (typeof window !== 'undefined') {
    // Initialize process if it doesn't exist
    window.process = window.process || {};
    
    // Ensure stdout exists and has all required properties
    window.process.stdout = window.process.stdout || {};
    Object.assign(window.process.stdout, {
      isTTY: false,
      write: function() {},
      columns: 80,
      getColorDepth: function() { return 24; },
      hasColors: function() { return false; },
      cursorTo: function() {},
      moveCursor: function() {},
      clearLine: function() {},
      clearScreenDown: function() {}
    });
    
    // Ensure stderr exists and has all required properties
    window.process.stderr = window.process.stderr || {};
    Object.assign(window.process.stderr, {
      isTTY: false,
      write: function() {},
      getColorDepth: function() { return 24; },
      hasColors: function() { return false; },
      cursorTo: function() {},
      moveCursor: function() {},
      clearLine: function() {},
      clearScreenDown: function() {}
    });
    
    // Add other commonly used process properties
    window.process.env = window.process.env || {
      NODE_ENV: 'production',
      DEBUG: '',
      GOOGLE_SDK_NODE_LOGGING: false,
      GOOGLE_APPLICATION_CREDENTIALS: '',
      GOOGLE_CLOUD_PROJECT: '',
      GOOGLE_CLOUD_REGION: ''
    };
    
    // Ensure process.version exists
    window.process.version = window.process.version || 'v16.0.0';
    
    // Add platform information
    window.process.platform = window.process.platform || 'browser';
    window.process.arch = window.process.arch || 'x64';
    
    // Add process methods
    window.process.nextTick = window.process.nextTick || function(callback) {
      setTimeout(callback, 0);
    };
    
    window.process.cwd = window.process.cwd || function() {
      return '/';
    };
    
    window.process.exit = window.process.exit || function(code) {
      console.warn('process.exit called with code:', code);
    };
    
    window.process.kill = window.process.kill || function(pid, signal) {
      console.warn('process.kill called with pid:', pid, 'signal:', signal);
    };
    
    // Add process events
    window.process.on = window.process.on || function() {};
    window.process.off = window.process.off || function() {};
    window.process.emit = window.process.emit || function() {};
    
    // Add process memory info
    window.process.memoryUsage = window.process.memoryUsage || function() {
      return {
        heapTotal: 0,
        heapUsed: 0,
        external: 0,
        rss: 0
      };
    };
    
    // Make process non-configurable to prevent accidental deletion
    try {
      Object.defineProperty(window, 'process', {
        configurable: false,
        writable: false
      });
    } catch (e) {
      console.warn('Could not make process non-configurable:', e);
    }
  }
})(); 