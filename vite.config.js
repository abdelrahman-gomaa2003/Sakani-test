import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    hmr: { overlay: false },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('react-dom') || id.includes('react-router')) return 'vendor';
            if (id.includes('supabase')) return 'supabase';
            if (id.includes('chart.js')) return 'charts';
            if (id.includes('leaflet') || id.includes('react-leaflet')) return 'leaflet';
          }
        },
      },
    },
  },
})
