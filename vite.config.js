import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
  server: {
    port: 5173,
    // Plain `vite` has no Pages Functions, so /api/* is proxied to the live
    // Cloudflare deployment (working functions + configured API key there).
    // `npm run preview` still serves the local functions via wrangler.
    proxy: {
      // Chat → Cloudflare deployment (has a working AI key today).
      // Once OPENROUTER_API_KEY is set on Vercel, both can point there.
      "/api/chat": {
        target: process.env.VITE_API_PROXY || "https://gencopilot.pages.dev",
        changeOrigin: true,
        secure: true,
      },
      // Everything else (news, market, contact, health) → Vercel.
      "/api": {
        target: process.env.VITE_API_PROXY || "https://gencofounder.vercel.app",
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
