import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";
import { nodePolyfills } from "vite-plugin-node-polyfills";
import path from "path";

export default defineConfig({
  plugins: [
    legacy({
      targets: ["defaults", "not IE 11"],
    }),
    react(),
    nodePolyfills(),
  ],
  esbuild: false,
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      moment: "moment/moment.js",
    },
  },
  build: {
    outDir: "dist",
    commonjsOptions: { transformMixedEsModules: true },
    assetsInlineLimit: 0,
    target: "es2015",
  },
  server: {
    port: 3000,
  },
});
