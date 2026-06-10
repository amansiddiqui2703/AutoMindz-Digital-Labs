import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  envDir: '../',
  server: {
    port: 5173,
    proxy: {
      '/api': 'http://localhost:5000',
      '/t': 'http://localhost:5000',
      '/unsubscribe': 'http://localhost:5000',
    },
  },
  build: {
    target: 'es2020',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'react-hot-toast'],
          'chart-vendor': ['recharts'],
          'editor-vendor': [
            '@tiptap/react',
            '@tiptap/starter-kit',
            '@tiptap/extension-link',
            '@tiptap/extension-image',
            '@tiptap/extension-placeholder',
            '@tiptap/extension-color',
            '@tiptap/extension-text-style',
            '@tiptap/extension-text-align',
            '@tiptap/extension-underline',
            '@tiptap/extension-bullet-list',
            '@tiptap/extension-ordered-list',
          ],
          'util-vendor': ['axios', 'date-fns'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
})
