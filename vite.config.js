// vite.config.js
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/wh": {
        target: "https://wallhaven.cc",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/wh/, ""),
      }
    }
  }
});
