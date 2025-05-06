import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import commonjs from 'vite-plugin-commonjs'
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    commonjs(),
    nodePolyfills({
      // Whether to polyfill `node:` protocol imports.
      protocolImports: true,
      // Add these specific polyfills to fix deployment issues
      include: [
        'crypto',
        'net',
        'http',
        'https',
        'http2',
        'zlib',
        'url',
        'process',
        'stream',
        'util',
        'buffer',
        'events'
      ],
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      // Add explicit aliases for problematic packages
      'react-hook-form': path.resolve(__dirname, 'node_modules/react-hook-form/dist/index.esm.mjs'),
      '@hookform/resolvers': path.resolve(__dirname, 'node_modules/@hookform/resolvers/dist/index.esm.js')
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
    // Fix ESM modules in production
    rollupOptions: {
      // Preserve ESM modules
      preserveEntrySignatures: 'strict',
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
