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
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-amplify": ["aws-amplify"],
          "vendor-react-bootstrap": [
            "react-bootstrap",
            "react-bootstrap-typeahead",
          ],
          "vendor-fontawesome": [
            "@fortawesome/fontawesome-svg-core",
            "@fortawesome/free-brands-svg-icons",
            "@fortawesome/free-regular-svg-icons",
            "@fortawesome/free-solid-svg-icons",
            "@fortawesome/react-fontawesome",
          ],
        },
        entryFileNames: `static/js/[name].js`,
        chunkFileNames: `static/js/[name].js`,
        assetFileNames: `static/css/[name].[ext]`,
      },
    },
  },
  server: {
    port: 3000,
  },
});
