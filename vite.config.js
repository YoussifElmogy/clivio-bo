import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        // One shared pages chunk — navigating between routes won't fetch new files.
        manualChunks(id) {
          if (id.includes('/src/pages/')) {
            return 'app-pages';
          }
        },
      },
    },
  },
})
