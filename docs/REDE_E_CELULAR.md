# Acessar pelo celular / outros aparelhos

Nada aqui exige login, cadastro ou conta. O servidor (`npm run dev`) ja escuta em **todas as redes** do PC.

## Como funciona
```
Celular --(wi-fi)--> PC:5173 (Vite) --proxy /api--> PC:8080 (backend)
```
O celular so fala com o front. O backend continua "escondido" em localhost no PC. Por isso o celular
consegue ver os dados do localhost sem configurar mais nada.

## Opcao 1 - http na mesma rede (mais simples)

1. PC e celular no **mesmo wi-fi** (wi-fi de visitantes/isolamento de clientes costuma bloquear).
2. No PC: `npm run dev` (e o backend ligado, ex.: `npm run dev:full`).
3. No PC: `npm run ip` -> aparece algo como `http://192.168.0.15:5173`.
4. Digite esse endereco no navegador do celular.
5. Va em **Conexao**: tem que aparecer "Backend conectado!".

## Opcao 2 - https na mesma rede

Use quando precisar de https (ex.: recursos do navegador que so funcionam em conexao segura).

1. No PC: `npm run dev:https`
2. No celular abra `https://IP-DO-PC:5173` (o `npm run ip` mostra).
3. O navegador vai avisar "conexao nao segura / certificado nao confiavel". **E esperado**: o certificado e
   criado no seu PC, nao por uma empresa.
   - **Android (Chrome):** Avancado -> Continuar para 192.168...
   - **iPhone (Safari):** Mostrar detalhes -> Visitar este site.
4. Depois de aceitar, tudo funciona normalmente.

## Opcao 3 - https "de verdade", sem aviso (tunel publico, sem conta)

```bash
npm run dev          # em um terminal
npm run tunnel       # em OUTRO terminal
```
O segundo comando imprime um endereco `https://algo-aleatorio.trycloudflare.com`. Abra no celular (funciona ate
fora do wi-fi). Nao precisa de conta. Fecha o terminal = o endereco deixa de existir.

- Atencao: **qualquer pessoa com o link** acessa seu ambiente de desenvolvimento. Nao compartilhe, e feche quando terminar.
- Nao usamos ngrok porque ele exige criar conta.
- Este tunel usa internet da Cloudflare: em rede de escola/empresa pode estar bloqueado.
- Pode aparecer aviso de reconexao do "HMR" no console: e so o recarregamento automatico, nao atrapalha.

## Nao abre no celular?

| Causa | Solucao |
|---|---|
| Firewall do PC | **Windows:** na 1a vez aparece "Permitir acesso" para o Node.js -> marque **Redes privadas**. Se ja negou: PowerShell **como administrador**: `netsh advfirewall firewall add rule name="Vite 5173" dir=in action=allow protocol=TCP localport=5173` . **Linux:** `sudo ufw allow 5173/tcp` . **Mac:** permita "node" em Ajustes -> Rede -> Firewall. |
| Redes diferentes | PC e celular precisam estar no mesmo wi-fi (celular sem 4G/5G ativo atrapalhando: desligue os dados moveis). |
| Wi-fi com "isolamento de clientes" (escola, visitantes) | Use o hotspot (roteador) do proprio celular ou de um colega, ou a Opcao 3. |
| IP mudou | O IP muda quando reconecta. Rode `npm run ip` de novo. |
| Abriu mas "Conexao" da erro | O front chegou, o backend nao: ligue o backend no PC. |
| Porta 5173 ocupada | Feche o outro `npm run dev`. |

## Seguranca (leia)
`npm run dev` deixa o servidor visivel para **toda a rede**. Em wi-fi publico (cafe, aeroporto) pare o servidor ou use so `localhost`.
Isso e ambiente de desenvolvimento: nunca hospede o projeto assim.
