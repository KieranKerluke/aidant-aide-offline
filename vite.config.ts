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
      // Override with custom polyfills
      globals: {
        process: true
      },
    }),
    // Inject process polyfill with stdout/stderr stubs
    {
      name: 'process-polyfill-enhancer',
      transformIndexHtml(html) {
        return {
          html,
          tags: [
            {
              tag: 'script',
              attrs: { type: 'module' },
              children: `
                // Enhance process polyfill with TTY properties
                if (window.process && !window.process.stdout) {
                  window.process.stdout = { 
                    isTTY: false,
                    write: () => {},
                    columns: 80
                  };
                  window.process.stderr = { 
                    isTTY: false,
                    write: () => {} 
                  };
                }
              `,
              injectTo: 'head'
            }
          ]
        };
      }
    },
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
    'process.env': JSON.stringify({ GOOGLE_SDK_NODE_LOGGING: false }),
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
        polyfill: path.resolve(__dirname, 'src/lib/google-polyfill-entry.js')
      },
      // Preserve ESM modules
      preserveEntrySignatures: 'strict',
      external: [
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
