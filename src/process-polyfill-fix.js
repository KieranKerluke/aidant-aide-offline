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
  
  // Create a backup of any existing process object
  var existingProcess = window.process;
  
  // Create a fresh process object
  var process = {};
  
  // Restore any existing properties
  if (existingProcess) {
    for (var key in existingProcess) {
      if (existingProcess.hasOwnProperty(key)) {
        process[key] = existingProcess[key];
      }
    }
  }
  
  // Ensure stdout exists with ALL required properties
  process.stdout = process.stdout || {};
  var stdout = {
    isTTY: false,
    write: function() {},
    columns: 80,
    rows: 24,
    getColorDepth: function() { return 1; },
    hasColors: function() { return false; },
    cursorTo: function() {},
    moveCursor: function() {},
    clearLine: function() {},
    clearScreenDown: function() {}
  };
  
  // Apply stdout properties, ensuring we don't lose any existing ones
  for (var prop in stdout) {
    if (stdout.hasOwnProperty(prop) && process.stdout[prop] === undefined) {
      process.stdout[prop] = stdout[prop];
    }
  }
  
  // Ensure stderr exists with ALL required properties
  process.stderr = process.stderr || {};
  var stderr = {
    isTTY: false,
    write: function() {},
    columns: 80,
    rows: 24,
    getColorDepth: function() { return 1; },
    hasColors: function() { return false; },
    cursorTo: function() {},
    moveCursor: function() {},
    clearLine: function() {},
    clearScreenDown: function() {}
  };
  
  // Apply stderr properties, ensuring we don't lose any existing ones
  for (var prop in stderr) {
    if (stderr.hasOwnProperty(prop) && process.stderr[prop] === undefined) {
      process.stderr[prop] = stderr[prop];
    }
  }
  
  // Ensure process.env exists
  process.env = process.env || {};
  
  // Add required environment variables for Google APIs
  var envDefaults = {
    NODE_ENV: 'production',
    DEBUG: '',
    GOOGLE_SDK_NODE_LOGGING: false,
    GOOGLE_APPLICATION_CREDENTIALS: '',
    GOOGLE_CLOUD_PROJECT: '',
    GOOGLE_CLOUD_REGION: ''
  };
  
  // Apply env defaults, ensuring we don't overwrite existing values
  for (var envVar in envDefaults) {
    if (envDefaults.hasOwnProperty(envVar) && process.env[envVar] === undefined) {
      process.env[envVar] = envDefaults[envVar];
    }
  }
  
  // Add other required process properties
  process.version = process.version || 'v16.0.0';
  process.versions = process.versions || { node: '16.0.0' };
  process.platform = process.platform || 'browser';
  process.arch = process.arch || 'x64';
  
  // Add required process methods
  process.nextTick = process.nextTick || function(callback) {
    setTimeout(callback, 0);
  };
  
  process.cwd = process.cwd || function() {
    return '/';
  };
  
  process.exit = process.exit || function(code) {
    console.warn('process.exit called with code:', code);
  };
  
  process.kill = process.kill || function(pid, signal) {
    console.warn('process.kill called with pid:', pid, 'signal:', signal);
  };
  
  // Add process events
  process.on = process.on || function() { return process; };
  process.off = process.off || function() { return process; };
  process.once = process.once || function() { return process; };
  process.emit = process.emit || function() { return false; };
  process.removeListener = process.removeListener || function() { return process; };
  process.removeAllListeners = process.removeAllListeners || function() { return process; };
  process.listeners = process.listeners || function() { return []; };
  
  // Add process memory info
  process.memoryUsage = process.memoryUsage || function() {
    return {
      heapTotal: 0,
      heapUsed: 0,
      external: 0,
      rss: 0,
      arrayBuffers: 0
    };
  };
  
  // Add process.hrtime for timing
  process.hrtime = process.hrtime || function(previousTimestamp) {
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
  
  // Assign the enhanced process object back to window
  window.process = process;
  
  // Also ensure global is defined for Google APIs
  if (typeof window.global === 'undefined') {
    window.global = window;
  }
  
  // Ensure Buffer is available
  if (typeof window.Buffer === 'undefined') {
    try {
      // Try to use the actual Buffer if available
      window.Buffer = require('buffer').Buffer;
    } catch (e) {
      // Provide a minimal Buffer polyfill
      window.Buffer = {
        isBuffer: function() { return false; },
        from: function(data) { return data; }
      };
    }
  }
  
  console.log('Enhanced Node.js process polyfill loaded successfully');
})();