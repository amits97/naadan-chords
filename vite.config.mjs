import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import vitePluginRequire from "vite-plugin-require";
import path from "path";

export default defineConfig({
  plugins: [react(), vitePluginRequire.default()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
    mainFields: [],
  },
  build: {
    outDir: "dist",
    commonjsOptions: { transformMixedEsModules: true },
    assetsInlineLimit: 0,
  },
  server: {
    port: 3000,
  },
});
