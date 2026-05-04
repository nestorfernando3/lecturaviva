import { defineConfig, loadEnv } from 'vite'
import { resolve } from 'path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  console.log('VITE_SUPABASE_URL:', env.VITE_SUPABASE_URL ? 'SET' : 'NOT SET')
  console.log('VITE_SUPABASE_ANON_KEY:', env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET')
  
  return {
    plugins: [react(), tailwindcss()],
    base: '/lecturaviva/',
    build: {
      rollupOptions: {
        input: {
          main: resolve(__dirname, 'index.html'),
          teacher: resolve(__dirname, 'teacher.html'),
        },
      },
    },
  }
})
