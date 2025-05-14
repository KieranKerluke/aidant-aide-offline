/**
 * ENHANCED PROCESS POLYFILL FOR NODE.JS IN BROWSER ENVIRONMENT
 * 
 * This script creates a comprehensive polyfill for the Node.js process object
 * which is required by Google APIs and other Node.js-oriented libraries.
 * 
 * It must be loaded BEFORE any other scripts that might use process.
 */

(function() {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  // Create a more robust process object
  var processPolyfill = {};
  
  // Create stdout and stderr with ALL required properties
  var stdoutPolyfill = {
    isTTY: false,
    write: function() { return true; },
    columns: 80,
    rows: 24,
    getColorDepth: function() { return 1; },
    hasColors: function() { return false; },
    cursorTo: function() { return true; },
    moveCursor: function() { return true; },
    clearLine: function() { return true; },
    clearScreenDown: function() { return true; }
  };
  
  var stderrPolyfill = {
    isTTY: false,
    write: function() { return true; },
    columns: 80,
    rows: 24,
    getColorDepth: function() { return 1; },
    hasColors: function() { return false; },
    cursorTo: function() { return true; },
    moveCursor: function() { return true; },
    clearLine: function() { return true; },
    clearScreenDown: function() { return true; }
  };
  
  // Define process.env
  var envPolyfill = {
    NODE_ENV: 'production',
    DEBUG: '',
    GOOGLE_SDK_NODE_LOGGING: false,
    GOOGLE_APPLICATION_CREDENTIALS: '',
    GOOGLE_CLOUD_PROJECT: '',
    GOOGLE_CLOUD_REGION: ''
  };
  
  // Define process methods
  processPolyfill.nextTick = function(callback) {
    setTimeout(callback, 0);
  };
  
  processPolyfill.cwd = function() {
    return '/';
  };
  
  processPolyfill.exit = function(code) {
    console.warn('process.exit called with code:', code);
  };
  
  processPolyfill.kill = function(pid, signal) {
    console.warn('process.kill called with pid:', pid, 'signal:', signal);
  };
  
  // Define process events
  processPolyfill.on = function() { return processPolyfill; };
  processPolyfill.off = function() { return processPolyfill; };
  processPolyfill.once = function() { return processPolyfill; };
  processPolyfill.emit = function() { return false; };
  processPolyfill.removeListener = function() { return processPolyfill; };
  processPolyfill.removeAllListeners = function() { return processPolyfill; };
  processPolyfill.listeners = function() { return []; };
  
  // Define process.memoryUsage
  processPolyfill.memoryUsage = function() {
    return {
      heapTotal: 0,
      heapUsed: 0,
      external: 0,
      rss: 0,
      arrayBuffers: 0
    };
  };
  
  // Define process.hrtime
  processPolyfill.hrtime = function(previousTimestamp) {
    var clocktime = performance.now() * 1e-3;
    var seconds = Math.floor(clocktime);
    var nanoseconds = Math.floor((clocktime % 1) * 1e9);
    
    if (previousTimestamp) {
      seconds = seconds - previousTimestamp[0];
      nanoseconds = nanoseconds - previousTimestamp[1];
      
      if (nanoseconds < 0) {
        seconds--;
        nanoseconds += 1e9;
      }
    }
    return [seconds, nanoseconds];
  };
  
  // Add version info
  processPolyfill.version = 'v16.0.0';
  processPolyfill.versions = { node: '16.0.0' };
  processPolyfill.platform = 'browser';
  processPolyfill.arch = 'x64';
  
  // Now merge with any existing process object
  var existingProcess = window.process || {};
  
  // Create a new process object that combines our polyfill with any existing process
  var process = {};
  
  // Copy properties from our polyfill
  for (var key in processPolyfill) {
    if (processPolyfill.hasOwnProperty(key)) {
      process[key] = processPolyfill[key];
    }
  }
  
  // Copy any existing properties, but don't overwrite our polyfill
  for (var key in existingProcess) {
    if (existingProcess.hasOwnProperty(key) && process[key] === undefined) {
      process[key] = existingProcess[key];
    }
  }
  
  // Ensure stdout and stderr are properly defined
  process.stdout = {};
  process.stderr = {};
  
  // Copy stdout properties
  for (var prop in stdoutPolyfill) {
    if (stdoutPolyfill.hasOwnProperty(prop)) {
      process.stdout[prop] = stdoutPolyfill[prop];
    }
  }
  
  // Copy stderr properties
  for (var prop in stderrPolyfill) {
    if (stderrPolyfill.hasOwnProperty(prop)) {
      process.stderr[prop] = stderrPolyfill[prop];
    }
  }
  
  // Ensure env is properly defined
  process.env = process.env || {};
  
  // Copy env properties
  for (var prop in envPolyfill) {
    if (envPolyfill.hasOwnProperty(prop) && process.env[prop] === undefined) {
      process.env[prop] = envPolyfill[prop];
    }
  }
  
  // Assign the enhanced process object to window
  window.process = process;
  
  // Also ensure global is defined for Google APIs
  if (typeof window.global === 'undefined') {
    window.global = window;
  }
  
  // Ensure Buffer is available
  if (typeof window.Buffer === 'undefined') {
    window.Buffer = {
      isBuffer: function() { return false; },
      from: function(data) { return data; },
      alloc: function(size) { return new Uint8Array(size); },
      allocUnsafe: function(size) { return new Uint8Array(size); },
      allocUnsafeSlow: function(size) { return new Uint8Array(size); }
    };
  }
  
  console.log('Enhanced Node.js process polyfill loaded successfully');
})();