import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      strategies: "injectManifest",
      srcDir: "src",
      filename: "sw.js",
      registerType: "autoUpdate",
      injectRegister: false,
      includeAssets: ["favicon.svg", "apple-touch-icon.svg", "icons/icon-192.svg", "icons/icon-512.svg", "icons/maskable-icon-512.svg"],
      manifest: {
        name: "CSE 61 D Schedule",
        short_name: "CSE 61D",
        id: "/",
        start_url: "/",
        scope: "/",
        display: "standalone",
        orientation: "any",
        theme_color: "#172033",
        background_color: "#f6f7f9",
        icons: [
          { src: "/icons/icon-192.svg", sizes: "192x192", type: "image/svg+xml" },
          { src: "/icons/icon-512.svg", sizes: "512x512", type: "image/svg+xml" },
          { src: "/icons/maskable-icon-512.svg", sizes: "512x512", type: "image/svg+xml", purpose: "maskable" }
        ]
      },
      injectManifest: {
        maximumFileSizeToCacheInBytes: 3 * 1024 * 1024
      }
    })
  ],
  server: {
    port: 5174
  }
});
