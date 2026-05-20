import vue from '@vitejs/plugin-vue'
import { defineConfig } from 'vite'
import pkg from './package.json'

export default defineConfig({
  define: {
    'import.meta.env.VITE_APP_VERSION': JSON.stringify(pkg.version),
    'import.meta.env.VITE_APP_REPO_URL': JSON.stringify(pkg.repository.url),
  },
  plugins: [vue()],
  resolve: {
    alias: {
      '@': '/src',
    },
  },
})
