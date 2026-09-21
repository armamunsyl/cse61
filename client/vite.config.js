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
      includeAssets: ["favicon-32x32.png", "apple-touch-icon.png", "icons/icon-192.png", "icons/icon-512.png", "icons/maskable-icon-512.png"],
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
          { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
          { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "/icons/maskable-icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" }
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
