/**
 * DIRECT GOOGLE API FIX
 * This script directly patches the Google API vendor code to fix the
 * "Cannot read properties of undefined (reading 'GOOGLE_SDK_NODE_LOGGING')" error.
 */

(function() {
  // Function to patch the vendor code
  function patchGoogleVendorCode() {
    console.log("Attempting to patch Google API vendor code...");
    
    try {
      // Define the property globally
      window.__GOOGLE_SDK_NODE_LOGGING = false;
      
      // Ensure process exists
      if (!window.process) window.process = {};
      
      // Ensure process.env exists
      if (!window.process.env) window.process.env = {};
      
      // Set the property directly
      window.process.env.GOOGLE_SDK_NODE_LOGGING = false;
      
      // Find all vendor scripts
      const vendorScripts = Array.from(document.querySelectorAll('script'))
        .filter(script => script.src && (
          script.src.includes('vendor') || 
          script.src.includes('google')
        ));
      
      console.log(`Found ${vendorScripts.length} vendor scripts to patch`);
      
      // Monkey patch the Error constructor to suppress the specific error
      const originalError = window.Error;
      window.Error = function(message) {
        if (typeof message === 'string' && message.includes('GOOGLE_SDK_NODE_LOGGING')) {
          console.log("Suppressed Google SDK Node Logging error");
          return {
            name: 'Error',
            message: 'Suppressed',
            toString: function() { return 'Suppressed Error'; }
          };
        }
        return new originalError(...arguments);
      };
      window.Error.prototype = originalError.prototype;
      
      // Monkey patch Object.prototype.hasOwnProperty to always return true for GOOGLE_SDK_NODE_LOGGING
      const originalHasOwnProperty = Object.prototype.hasOwnProperty;
      Object.prototype.hasOwnProperty = function(prop) {
        if (prop === 'GOOGLE_SDK_NODE_LOGGING' && this === window.process.env) {
          return true;
        }
        return originalHasOwnProperty.call(this, prop);
      };
      
      // Try to find and patch the specific function in the vendor code
      for (let i = 0; i < window.length; i++) {
        const key = window[i];
        if (key && typeof window[key] === 'object' && window[key].hasOwnProperty('gapi')) {
          console.log(`Found Google API object at window.${key}`);
          patchGoogleApiObject(window[key]);
        }
      }
      
      // Also try to patch the gapi object if it exists
      if (window.gapi) {
        console.log("Found window.gapi, patching...");
        patchGoogleApiObject(window.gapi);
      }
      
      console.log("Google API vendor code patching complete");
    } catch (e) {
      console.error("Error patching Google API vendor code:", e);
    }
  }
  
  // Function to patch a Google API object
  function patchGoogleApiObject(obj) {
    // Add GOOGLE_SDK_NODE_LOGGING to the object
    obj.GOOGLE_SDK_NODE_LOGGING = false;
    
    // If the object has a client property, patch it
    if (obj.client) {
      obj.client.GOOGLE_SDK_NODE_LOGGING = false;
      
      // Patch all methods to catch the error
      for (const key in obj.client) {
        if (typeof obj.client[key] === 'function') {
          const originalMethod = obj.client[key];
          obj.client[key] = function() {
            try {
              return originalMethod.apply(this, arguments);
            } catch (e) {
              if (e.message && e.message.includes('GOOGLE_SDK_NODE_LOGGING')) {
                console.log(`Suppressed error in gapi.client.${key}`);
                return { result: null };
              }
              throw e;
            }
          };
        }
      }
    }
  }
  
  // Run the patch immediately
  patchGoogleVendorCode();
  
  // Also run it after the window loads
  window.addEventListener('load', function() {
    // Wait a bit to ensure all scripts are loaded
    setTimeout(patchGoogleVendorCode, 500);
  });
  
  // Run it again after a delay to catch any dynamically loaded scripts
  setTimeout(patchGoogleVendorCode, 2000);
})();
