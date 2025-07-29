import { defineConfig } from 'vite'
import path from 'path'

// Widget-specific build configuration
export default defineConfig({
  build: {
    lib: {
      entry: path.resolve(__dirname, 'src/widget.ts'),
      name: 'TrustLoopsWidget',
      fileName: 'widget',
      formats: ['iife']
    },
    outDir: 'dist/widget',
    minify: 'terser',
    sourcemap: false,
    rollupOptions: {
      output: {
        // Remove hash from filename for consistent widget.js name
        entryFileNames: 'widget.js'
      }
    }
  }
})
