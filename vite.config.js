import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// three.js and React Three Fiber are only reached through the lazy HeroScene
// import, so they land in a separate chunk loaded after the HTML hero renders.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  build: {
    chunkSizeWarningLimit: 1100,
  },
})
