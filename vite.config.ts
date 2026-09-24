import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import basicSsl from '@vitejs/plugin-basic-ssl'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backend = env.BACKEND_URL || 'http://localhost:8080'

  // Tudo que o front chamar em /api/... e repassado ao backend, SEM o prefixo /api.
  //   front:   fetch('/api/actuator/health')  ->  backend: GET http://localhost:8080/actuator/health
  // Vantagens: o celular so precisa alcancar o front (o backend continua em localhost),
  // e nao existe problema de CORS.
  const proxy = {
    '/api': {
      target: backend,
      changeOrigin: true,
      rewrite: (path: string) => path.replace(/^\/api/, ''),
    },
  }

  // "npm run dev:https" = mode "https" -> certificado autoassinado (celular acessa via https://)
  const usarHttps = mode === 'https'

  return {
    plugins: [react(), ...(usarHttps ? [basicSsl()] : [])],
    server: {
      host: true, // 0.0.0.0: qualquer aparelho na mesma rede acessa pelo IP do seu PC
      port: 5173,
      strictPort: true, // se a 5173 estiver ocupada, avisa em vez de trocar de porta em silencio
      proxy,
      // dominios de tunel HTTPS gratuito (sem login), ver docs/REDE_E_CELULAR.md
      allowedHosts: ['.trycloudflare.com', '.loca.lt', '.ngrok-free.app', '.ngrok.io'],
    },
    preview: { host: true, port: 4173, strictPort: true, proxy },
    test: {
      environment: 'jsdom',
      globals: true,
      setupFiles: './src/test/setup.ts',
      css: false,
    },
  }
})
