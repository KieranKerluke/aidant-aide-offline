/**
 * CRITICAL: Early Process Polyfill
 * Must be loaded before any other scripts to prevent Google SDK errors
 */
(function() {
  // Define this globally so it's available to all scripts
  window.__GOOGLE_SDK_NODE_LOGGING = false;
  
  // Ensure process and process.env exist
  window.process = window.process || {};
  window.process.env = window.process.env || {};
  
  // Set the property directly
  window.process.env.GOOGLE_SDK_NODE_LOGGING = false;
  
  // Create a proxy for process.env to catch any attempts to access GOOGLE_SDK_NODE_LOGGING
  const originalEnv = window.process.env;
  window.process.env = new Proxy(originalEnv, {
    get: function(target, prop) {
      // If the property is GOOGLE_SDK_NODE_LOGGING, always return false
      if (prop === 'GOOGLE_SDK_NODE_LOGGING') {
        return false;
      }
      // Otherwise, return the original property
      return target[prop];
    }
  });
  
  // Patch Object.prototype.hasOwnProperty to handle GOOGLE_SDK_NODE_LOGGING
  const originalHasOwnProperty = Object.prototype.hasOwnProperty;
  Object.prototype.hasOwnProperty = function(prop) {
    if (this === window.process?.env && prop === 'GOOGLE_SDK_NODE_LOGGING') {
      return true;
    }
    return originalHasOwnProperty.call(this, prop);
  };
  
  console.log('Early process polyfill applied');
})();