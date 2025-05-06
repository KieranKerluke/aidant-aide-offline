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
    rollupOptions: {
      external: ['react-hook-form'],
      // Preserve dynamic imports for code-splitting
      output: {
        manualChunks: (id) => {
          if (id.includes('node_modules')) {
            // Group Radix UI components together
            if (id.includes('@radix-ui')) {
              return 'vendor_radix';
            }
            // Group form-related packages
            if (id.includes('react-hook-form')) {
              return 'vendor_forms';
            }
            // Group other vendor code
            return 'vendor';
          }
        },
      },
    },
  },
}));
