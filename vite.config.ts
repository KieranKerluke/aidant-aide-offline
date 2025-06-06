import { defineConfig, Plugin } from "vite";
import react from "@vitejs/plugin-react-swc";
import { nodePolyfills } from 'vite-plugin-node-polyfills'
import commonjs from 'vite-plugin-commonjs'
import path from "path";

// Custom plugin to inject process polyfill at the beginning of the bundle
function processPolyfillPlugin(): Plugin {
  const processPolyfill = `
    // Process polyfill for isTTY error and Google SDK
    (function() {
      if (typeof window !== 'undefined') {
        // Ensure process exists
        window.process = window.process || {};
        
        // Set up stdout and stderr
        window.process.stdout = window.process.stdout || {};
        window.process.stdout.isTTY = false;
        window.process.stderr = window.process.stderr || {};
        window.process.stderr.isTTY = false;
        
        // Set up process.env with required Google SDK properties
        window.process.env = window.process.env || {};
        window.process.env.GOOGLE_SDK_NODE_LOGGING = false;
        window.process.env.NODE_ENV = window.process.env.NODE_ENV || 'production';
        window.process.env.DEBUG = window.process.env.DEBUG || '';
        
        // Ensure global is defined
        window.global = window;
      }
    })();
  `;

  return {
    name: 'vite-plugin-process-polyfill',
    enforce: 'pre',
    transformIndexHtml(html) {
      return html.replace(
        '<head>',
        `<head>\n<script>${processPolyfill}</script>`
      );
    },
    renderChunk(code, chunk) {
      // Only inject in entry chunks
      if (chunk.isEntry) {
        return processPolyfill + code;
      }
      return code;
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    // Add our custom process polyfill plugin first to ensure it runs before other plugins
    processPolyfillPlugin(),
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
        'events',
        'querystring'
      ],
      // Override with custom polyfills
      globals: {
        process: true
      },
    }),
  ],
  optimizeDeps: {
    include: ['react-hook-form', '@hookform/resolvers/zod', 'zod'],
    esbuildOptions: {
      target: 'es2020',
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    extensions: ['.mjs', '.js', '.ts', '.jsx', '.tsx', '.json']
  },
  define: {
    // Define process.env with all necessary properties for Google APIs
    'process.env': JSON.stringify({
      GOOGLE_SDK_NODE_LOGGING: false,
      NODE_ENV: process.env.NODE_ENV || 'production',
      DEBUG: '',
      GOOGLE_APPLICATION_CREDENTIALS: '',
      GOOGLE_CLOUD_PROJECT: '',
      GOOGLE_CLOUD_REGION: ''
    }),
    // Define process.stdout and process.stderr to fix isTTY error
    'process.stdout': JSON.stringify({ isTTY: false }),
    'process.stderr': JSON.stringify({ isTTY: false }),
    // Ensure global is defined
    'global': 'window',
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
      // Add the polyfill as an entry point
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      // Preserve ESM modules
      preserveEntrySignatures: 'strict',
      external: [
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
