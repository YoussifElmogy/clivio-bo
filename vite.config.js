import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function emitDeployVersion() {
  return {
    name: 'emit-deploy-version',
    generateBundle() {
      this.emitFile({
        type: 'asset',
        fileName: 'version.json',
        source: JSON.stringify({
          builtAt: Date.now(),
        }),
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), emitDeployVersion()],
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
