import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // base relativo './' para suportar GitHub Pages e subdiretórios sem quebrar assets
  base: './',
})
