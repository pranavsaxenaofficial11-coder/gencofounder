import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    // Plain `vite` has no Pages Functions, so /api/* is proxied to the live
    // Cloudflare deployment (working functions + configured API key there).
    // `npm run preview` still serves the local functions via wrangler.
    proxy: {
      "/api": {
        target: "https://gencopilot.pages.dev",
        changeOrigin: true,
        secure: true,
      },
    },
  },
  build: {
    outDir: "dist",
    sourcemap: false,
    minify: "esbuild",
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          charts: ["recharts"],
        },
      },
    },
  },
});
