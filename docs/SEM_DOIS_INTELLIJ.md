# Meu PC nao aguenta 2 IntelliJ abertos. E agora?

Backend (Java) e front (Vite) sao repositorios separados, mas **nao** precisam de dois IntelliJ.
Escolha UMA das combinacoes abaixo, da mais leve para a mais pesada.

## Combinacao 1 (recomendada): VS Code no front + tudo rodando por terminal
- Abra a pasta `nexus-front` no **VS Code** (bem mais leve que o IntelliJ).
- Para rodar tudo (front + back) num terminal so:
  ```bash
  npm run dev:full
  ```
  O backend sobe com banco H2 em memoria: sem MySQL e sem Docker. `Ctrl+C` para tudo.
- Pre-requisitos: JDK 21 e o backend clonado ao lado (`../nexus`). Ver README.
- Quem trabalha so no front nao abre IntelliJ nenhum.

## Combinacao 2: IntelliJ so no backend + VS Code no front
Quem esta desenvolvendo o backend abre o IntelliJ **so** na pasta `nexus`; o front roda em terminal:
```bash
npm run dev
```

## Combinacao 3: 1 IntelliJ com os dois projetos (janela unica)
No IntelliJ: **File -> Open** -> escolha a pasta `nexus-front` -> **Attach** (nao "New Window").
Fica tudo em uma janela so. Limitacao: o IntelliJ Community nao tem bom suporte a React/TypeScript
(so o Ultimate). Serve para navegar; para editar o front prefira o VS Code.

## Dicas para PC fraco
- Feche navegador com muitas abas e o Docker Desktop se nao for usar MySQL (use o perfil **h2**).
- No IntelliJ: **Help -> Change Memory Settings** e nao aumente alem do necessario; feche projetos que nao usa.
- Rode os testes do backend pelo terminal (`./mvnw test`) em vez de pela IDE.
- Um colega com PC melhor pode deixar o backend ligado e voce apontar para ele: crie `.env` com
  `BACKEND_URL=http://IP-DO-COLEGA:8080` (o backend dele precisa aceitar conexoes da rede e o firewall liberar a 8080).
