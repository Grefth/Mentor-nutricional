import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  /** Proxy en dev para /api-health. Si Vercel no tiene rutas nuevas (p. ej. /meal/log), usa API local en `.env.local`: VITE_HEALTH_API_PROXY_TARGET=http://127.0.0.1:8000 */
  const healthProxyTarget =
    env.VITE_HEALTH_API_PROXY_TARGET ||
    'http://0.0.0.0:8000'

  return {
    plugins: [react(), tailwindcss()],
    server: {
      proxy: {
        '/api-health': {
          target: healthProxyTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/api-health/, ''),
        },
      },
    },
  }
})
