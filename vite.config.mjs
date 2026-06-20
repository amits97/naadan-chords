import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import legacy from "@vitejs/plugin-legacy";
import path from "path";

export default defineConfig({
  plugins: [
    legacy({
      targets: ["defaults", "not IE 11"],
    }),
    react(),
  ],
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
        manualChunks(id) {
          if (id.includes("node_modules")) {
            if (id.includes("aws-amplify")) {
              return "vendor-amplify";
            }
            if (
              id.includes("react-bootstrap") ||
              id.includes("react-bootstrap-typeahead")
            ) {
              return "vendor-react-bootstrap";
            }
            if (id.includes("@fortawesome")) {
              return "vendor-fontawesome";
            }
          }
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
