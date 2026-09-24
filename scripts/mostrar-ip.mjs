// Mostra os enderecos para abrir o projeto no celular. Uso: npm run ip
import os from 'node:os'

const porta = 5173
const enderecos = Object.values(os.networkInterfaces())
  .flat()
  .filter((i) => i && i.family === 'IPv4' && !i.internal)
  .map((i) => i.address)

console.log('\n=== Abra no celular (celular e PC na MESMA rede wi-fi) ===\n')
if (enderecos.length === 0) {
  console.log('Nenhuma rede encontrada. Conecte o PC ao wi-fi/cabo.\n')
} else {
  for (const ip of enderecos) {
    console.log(`  http://${ip}:${porta}    (npm run dev)`)
    console.log(`  https://${ip}:${porta}   (npm run dev:https)\n`)
  }
  console.log('Se nao abrir: libere a porta 5173 no firewall (docs/REDE_E_CELULAR.md).\n')
}
