import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  base: '/',
  plugins: [svelte()],
  // heic-to ships a ~2.9MB Emscripten/WASM bundle. Vite's dep optimizer
  // chokes on it (silently in dev → "failed to load"). Exclude so it's
  // served as-is and only fetched when a HEIC file is picked.
  optimizeDeps: {
    exclude: ['heic-to']
  },
  build: {
    outDir: 'docs',
    chunkSizeWarningLimit: 800
  }
})
