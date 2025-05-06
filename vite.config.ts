import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // Improve build compatibility
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    sourcemap: false,
    minify: 'terser',
    cssMinify: true,
    // Reduce chunk size warnings
    chunkSizeWarningLimit: 1000,
    // Set a more permissive input option to handle edge cases
    write: true,
    rollupOptions: {
      external: [
        // Form-related packages
        'react-hook-form',
        '@hookform/resolvers/zod',
        'zod',
        
        // Document generation libraries
        'file-saver', 
        'docx',
        
        // Node polyfills that might cause issues
        'events',
        'stream',
        'util',
        'buffer',
        'querystring'
      ],
      // Preserve dynamic imports for code-splitting
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Group Radix UI components together
            if (id.includes('@radix-ui')) {
              return 'vendor_radix';
            }
            // Group form-related packages
            if (id.includes('react-hook-form') || id.includes('@hookform/resolvers') || id.includes('zod')) {
              return 'vendor_forms';
            }
            // Group document generation related packages
            if (id.includes('file-saver') || id.includes('docx')) {
              return 'vendor_docs';
            }
            // Group APIs and utilities
            if (id.includes('googleapis') || id.includes('google-auth')) {
              return 'vendor_google';
            }
            // Group other vendor code
            return 'vendor';
          }
        },
      },
    },
  },
}));
