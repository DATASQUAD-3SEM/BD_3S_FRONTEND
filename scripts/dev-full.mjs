// Sobe BACKEND + FRONT em UM terminal so (sem precisar de dois IntelliJ).  Uso: npm run dev:full
// O backend roda com o perfil h2 (banco em memoria, sem instalar MySQL).
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'
import process from 'node:process'

// Le o arquivo .env (se existir) para pegar BACKEND_DIR
try {
  process.loadEnvFile('.env')
} catch {
  // sem .env: tudo bem, usa os padroes
}

const windows = process.platform === 'win32'
const backendDir = path.resolve(process.env.BACKEND_DIR ?? '../nexus')
const mvnw = path.join(backendDir, windows ? 'mvnw.cmd' : 'mvnw')

if (!existsSync(mvnw)) {
  console.error(`\n[dev:full] Nao achei o backend em: ${backendDir}`)
  console.error('Clone o repositorio do backend ao lado deste (pasta "nexus"),')
  console.error('ou crie um arquivo .env com BACKEND_DIR=caminho/do/backend\n')
  process.exit(1)
}

const filhos = []

function iniciar(prefixo, comando, args, opcoes) {
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

console.log('[dev:full] Subindo backend (h2) e front. Para parar tudo: Ctrl+C\n')
iniciar('back ', windows ? `"${mvnw}"` : mvnw, ['spring-boot:run', '-Dspring-boot.run.profiles=h2'], { cwd: backendDir })
iniciar('front', 'npx', ['vite'], { cwd: process.cwd() })
