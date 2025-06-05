/**
 * CRITICAL FIX FOR PROCESS.STDOUT.ISTTY ERROR
 * 
 * This module specifically addresses the "Cannot read properties of undefined (reading 'isTTY')" error
 * by ensuring process.stdout and process.stderr exist with the isTTY property properly defined.
 * 
 * This file must be imported before any other code that might use process.stdout.isTTY.
 */

// Use a self-executing function to avoid polluting the global scope
(function() {
  // Only run in browser environment
  if (typeof window === 'undefined') return;
  
  // Ensure process exists
  if (!window.process) {
    window.process = {};
  }
  
  // Ensure stdout exists with isTTY property
  if (!window.process.stdout) {
    window.process.stdout = {
      isTTY: false,
      write: function() { return true; }
    };
  } else if (window.process.stdout.isTTY === undefined) {
    window.process.stdout.isTTY = false;
  }
  
  // Ensure stderr exists with isTTY property
  if (!window.process.stderr) {
    window.process.stderr = {
      isTTY: false,
      write: function() { return true; }
    };
  } else if (window.process.stderr.isTTY === undefined) {
    window.process.stderr.isTTY = false;
  }
  
  console.log('Process TTY fix applied successfully');
})();

// Export an empty object to make this a proper ES module
export {};
