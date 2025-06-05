/**
 * CRITICAL: Early Process Polyfill
 * Must be loaded before any other scripts to prevent Google SDK errors
 */
(function() {
  console.log("Early polyfill initializing...");
  
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
    },
    has: function(target, prop) {
      if (prop === 'GOOGLE_SDK_NODE_LOGGING') {
        return true;
      }
      return prop in target;
    }
  });
  
  // Patch Object.prototype.hasOwnProperty to handle GOOGLE_SDK_NODE_LOGGING
  const originalHasOwnProperty = Object.prototype.hasOwnProperty;
  Object.prototype.hasOwnProperty = function(prop) {
    if (prop === 'GOOGLE_SDK_NODE_LOGGING') {
      return true;
    }
    return originalHasOwnProperty.call(this, prop);
  };
  
  // Override the Error constructor to suppress the specific error
  const originalError = Error;
  window.Error = function(message) {
    if (message && typeof message === 'string' && message.includes('GOOGLE_SDK_NODE_LOGGING')) {
      console.log('Prevented error about GOOGLE_SDK_NODE_LOGGING');
      return new originalError('Error suppressed');
    }
    return new originalError(...arguments);
  };
  window.Error.prototype = originalError.prototype;
  
  // Define a getter for process.env that always returns an object with GOOGLE_SDK_NODE_LOGGING
  Object.defineProperty(window, 'process', {
    configurable: true,
    enumerable: true,
    get: function() {
      return {
        env: new Proxy({}, {
          get: function(target, prop) {
            if (prop === 'GOOGLE_SDK_NODE_LOGGING') {
              return false;
            }
            return target[prop];
          },
          has: function(target, prop) {
            if (prop === 'GOOGLE_SDK_NODE_LOGGING') {
              return true;
            }
            return prop in target;
          }
        })
      };
    }
  });
  
  // Patch the 'in' operator for process.env
  // This is done by adding a property to Object.prototype that will be checked by the 'in' operator
  Object.defineProperty(Object.prototype, 'GOOGLE_SDK_NODE_LOGGING', {
    configurable: true,
    get: function() {
      if (this === window.process?.env) {
        return false;
      }
      return undefined;
    }
  });
  
  console.log('Enhanced early process polyfill applied');
})();