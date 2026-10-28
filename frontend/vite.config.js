import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

function omitUnusedBundledOrtWasm() {
  return {
    name: "omit-unused-bundled-ort-wasm",
    generateBundle(_options, bundle) {
      // Transformers.js 4 pins and loads the matching ORT WASM/MJS pair from
      // jsDelivr in browsers. Vite still emits an unreachable 26 MB fallback.
      for (const fileName of Object.keys(bundle)) {
        if (/^assets\/ort-wasm-.*\.wasm$/.test(fileName)) delete bundle[fileName];
      }
    },
  };
}

export default defineConfig({
  plugins: [react(), omitUnusedBundledOrtWasm()],
  build: {
    sourcemap: true,
  },
});
