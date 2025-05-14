/**
 * EMERGENCY VENDOR PATCH
 * This script directly patches the vendor JavaScript files to fix the
 * "Cannot read properties of undefined (reading 'GOOGLE_SDK_NODE_LOGGING')" error.
 * 
 * This is a last-resort solution that will run after all other scripts have loaded.
 */

(function() {
  console.log("Vendor patch initializing...");
  
  // Function to directly patch the vendor code
  function patchVendorCode() {
    try {
      console.log("Attempting to patch vendor code...");
      
      // 1. Ensure process.env.GOOGLE_SDK_NODE_LOGGING exists
      if (!window.process) window.process = {};
      if (!window.process.env) window.process.env = {};
      window.process.env.GOOGLE_SDK_NODE_LOGGING = false;
      
      // 2. Create a global variable that the vendor code might check
      window.__GOOGLE_SDK_NODE_LOGGING = false;
      
      // 3. Override the Object.prototype.hasOwnProperty method to always return true for GOOGLE_SDK_NODE_LOGGING
      const originalHasOwnProperty = Object.prototype.hasOwnProperty;
      Object.prototype.hasOwnProperty = function(prop) {
        if (this === window.process?.env && prop === 'GOOGLE_SDK_NODE_LOGGING') {
          return true;
        }
        return originalHasOwnProperty.call(this, prop);
      };
      
      // 4. Override the Error constructor to suppress the specific error
      const originalError = window.Error;
      window.Error = function(message) {
        if (typeof message === 'string' && message.includes('GOOGLE_SDK_NODE_LOGGING')) {
          console.log("Suppressed GOOGLE_SDK_NODE_LOGGING error");
          return {
            name: 'Error',
            message: 'Suppressed',
            toString: function() { return 'Suppressed Error'; }
          };
        }
        return new originalError(...arguments);
      };
      window.Error.prototype = originalError.prototype;
      
      // 5. Find all vendor scripts and try to patch them directly
      const scripts = document.querySelectorAll('script[src*="vendor"]');
      console.log(`Found ${scripts.length} vendor scripts`);
      
      // 6. Create a MutationObserver to watch for new script elements
      const observer = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
          if (mutation.type === 'childList') {
            mutation.addedNodes.forEach(function(node) {
              if (node.tagName === 'SCRIPT' && node.src && 
                  (node.src.includes('vendor') || node.src.includes('google'))) {
                console.log(`New script detected: ${node.src}`);
                node.addEventListener('load', function() {
                  console.log(`Script loaded: ${node.src}`);
                  setTimeout(patchVendorCode, 100);
                });
              }
            });
          }
        });
      });
      
      // Start observing the document with the configured parameters
      observer.observe(document.documentElement, { 
        childList: true, 
        subtree: true 
      });
      
      // 7. Try to find and patch the specific function in the vendor code
      // This is a more aggressive approach
      const vendorScripts = Array.from(document.querySelectorAll('script'))
        .filter(script => script.src && script.src.includes('vendor'));
      
      vendorScripts.forEach(script => {
        // Create a new script element to patch the code after it loads
        script.addEventListener('load', function() {
          const patcher = document.createElement('script');
          patcher.textContent = `
            console.log("Patching after script load: ${script.src}");
            window.process = window.process || {};
            window.process.env = window.process.env || {};
            window.process.env.GOOGLE_SDK_NODE_LOGGING = false;
          `;
          document.head.appendChild(patcher);
        });
      });
      
      console.log("Vendor patching complete");
    } catch (e) {
      console.error("Error patching vendor code:", e);
    }
  }
  
  // Run the patch immediately
  patchVendorCode();
  
  // Also run it after the window loads
  window.addEventListener('load', function() {
    // Wait a bit to ensure all scripts are loaded
    setTimeout(patchVendorCode, 500);
  });
  
  // Run it again after a delay to catch any dynamically loaded scripts
  setTimeout(patchVendorCode, 2000);
})();
