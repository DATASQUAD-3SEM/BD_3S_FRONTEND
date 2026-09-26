// Sobe front + túnel cloudflared em UM terminal.
// Uso: npm run dev:tunnel
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

const windows = process.platform === 'win32'
const BACKEND_DIR = path.resolve(process.env.BACKEND_DIR ?? '../BD_3S_BACKEND')
const mvnw = path.join(BACKEND_DIR, windows ? 'mvnw.cmd' : 'mvnw')
const subirBackend = process.env.SEM_BACKEND !== '1'

const filhos = []
function iniciar(prefixo, comando, args, opcoes = {}) {
  const filho = spawn(comando, args, { ...opcoes, shell: windows })
  const repassar = (fluxo) =>
    fluxo.on('data', (dados) => {
      for (const linha of dados.toString().split(/\r?\n/)) {
        if (linha.trim()) console.log(`[${prefixo}] ${linha}`)
      }
    })
  repassar(filho.stdout)
  repassar(filho.stderr)
  filho.on('exit', (codigo) => {
    console.log(`[${prefixo}] encerrou (codigo ${codigo})`)
    encerrarTudo(codigo ?? 0)
  })
  filhos.push(filho)
}

let encerrando = false
function encerrarTudo(codigo) {
  if (encerrando) return
  encerrando = true
  for (const f of filhos) {
    if (windows && f.pid) spawn('taskkill', ['/pid', String(f.pid), '/T', '/F'])
    else f.kill('SIGTERM')
  }
  setTimeout(() => process.exit(codigo), 500)
}
process.on('SIGINT', () => encerrarTudo(0))
process.on('SIGTERM', () => encerrarTudo(0))

console.log('[dev:tunnel] Subindo front + tunel publico. Para parar tudo: Ctrl+C\n')

if (subirBackend) {
  if (!existsSync(mvnw)) {
    console.error(`[dev:tunnel] Backend nao encontrado em: ${BACKEND_DIR}`)
    console.error('[dev:tunnel] Rode SEM_BACKEND=1 npm run dev:tunnel ou ajuste BACKEND_DIR no .env\n')
    process.exit(1)
  }
  iniciar('back ', windows ? `"${mvnw}"` : mvnw, ['spring-boot:run', '-Dspring-boot.run.profiles=h2'], { cwd: BACKEND_DIR })
}

iniciar('front', 'npx', ['vite', '--host'], { cwd: process.cwd() })

// Espera o Vite subir antes de abrir o tunel.
setTimeout(() => {
  iniciar('tunel', 'npx', [
    '--yes', 'cloudflared', 'tunnel',
    '--url', 'https://localhost:5173',
    '--no-tls-verify',
  ], { cwd: process.cwd() })
}, 4000)
