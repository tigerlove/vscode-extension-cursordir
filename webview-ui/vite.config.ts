import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "build",
    // Ensure assets are built with relative paths
    assetsDir: "assets",
    // Generate manifest for proper asset loading
    manifest: true,
    rollupOptions: {
      input: {
        index: resolve(__dirname, 'index.html')
      },
      output: {
        entryFileNames: `assets/[name].js`,
        chunkFileNames: `assets/[name].js`,
        assetFileNames: (assetInfo) => {
          if (assetInfo.name === 'index.css') {
            return 'assets/index.css';
          }
          return 'assets/[name].[ext]';
        },
      },
    },
  },
  // Use relative base path for assets
  base: "./",
  // Copy only specific static assets to build
  publicDir: 'src',
  // Prevent JSON parsing
  json: {
    stringify: true
  },
  css: {
    // Ensure CSS modules are handled correctly
    modules: {
      scopeBehaviour: 'local',
    },
  },
});
