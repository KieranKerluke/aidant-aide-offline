/**
 * GOOGLE API PATCH
 * 
 * This file directly patches the Google API libraries to prevent the
 * "Cannot read properties of undefined (reading 'GOOGLE_SDK_NODE_LOGGING')" error.
 * 
 * It must be imported before any Google API code.
 */

// Execute immediately
(function() {
  // Create a direct global variable that the Google API code will check
  window.__GOOGLE_SDK_NODE_LOGGING = false;
  
  // Ensure process and process.env exist
  window.process = window.process || {};
  window.process.env = window.process.env || {};
  
  // Directly set the GOOGLE_SDK_NODE_LOGGING property
  window.process.env.GOOGLE_SDK_NODE_LOGGING = false;
  
  // Create a proxy for process.env to catch any attempts to access GOOGLE_SDK_NODE_LOGGING
  const originalEnv = window.process.env;
  window.process.env = new Proxy(originalEnv, {
    get: function(target, prop) {
      // If the property is GOOGLE_SDK_NODE_LOGGING, always return false
      if (prop === 'GOOGLE_SDK_NODE_LOGGING') {
        return false;
      }
      // Otherwise, return the original property or undefined
      return target[prop];
    }
  });
  
  // Patch the specific Google API function that's causing the error
  // This is a more aggressive approach that directly modifies the Google API code
  const patchGoogleApi = function() {
    try {
      // Try to find the Google API object
      if (window.gapi) {
        // Patch the logging function
        const patchLoggingCheck = function(obj) {
          for (const key in obj) {
            if (typeof obj[key] === 'function') {
              const original = obj[key];
              obj[key] = function() {
                try {
                  return original.apply(this, arguments);
                } catch (e) {
                  if (e.message && e.message.includes('GOOGLE_SDK_NODE_LOGGING')) {
                    console.log('Suppressed Google API error about GOOGLE_SDK_NODE_LOGGING');
                    return false;
                  }
                  throw e;
                }
              };
            } else if (obj[key] && typeof obj[key] === 'object') {
              patchLoggingCheck(obj[key]);
            }
          }
        };
        
        // Apply the patch
        patchLoggingCheck(window.gapi);
      }
    } catch (e) {
      console.error('Error patching Google API:', e);
    }
  };
  
  // Run the patch now and also when the window loads
  patchGoogleApi();
  window.addEventListener('load', patchGoogleApi);
  
  // Also patch any dynamically loaded scripts
  const originalAppendChild = document.head.appendChild;
  document.head.appendChild = function(element) {
    if (element.tagName === 'SCRIPT' && element.src && element.src.includes('googleapis.com')) {
      element.onload = function() {
        setTimeout(patchGoogleApi, 100);
      };
    }
    return originalAppendChild.call(this, element);
  };
  
  console.log('Google API patch applied to fix GOOGLE_SDK_NODE_LOGGING issue');
})();

// Export an empty object to make this a proper ES module
export {};
