# Nexus - Frontend

Interface do Nexus (fluxo de trabalho do FUSEX). O backend fica em outro repositorio (`BD_3S_BACKEND`).

**Stack:** Vite 8 - React 19 - TypeScript - React Router - Vitest + Testing Library - Node 20.19+ (recomendado 22)

---

## 1. O que instalar (uma vez so)

| Programa                                       | Como conferir                          |
| ---------------------------------------------- | -------------------------------------- |
| **Node.js 22 LTS** (<https://nodejs.org>)      | `node -v` mostra v22.x (minimo v20.19) |
| **Git**                                        | `git --version`                        |
| **VS Code** (recomendado para o front, e leve) | -                                      |

## 2. Rodar pela primeira vez

```bash
git clone <URL-DO-REPOSITORIO-FRONT>
cd BD_3S_FRONTEND
git checkout develop
npm install          # so na primeira vez e quando o package.json mudar
npm run dev
```

Abra <http://localhost:5173>. Va em **Conexao** no menu para testar o backend.

### Precisa do backend ligado?

Para as telas que buscam dados, sim. Voce tem 3 jeitos (escolha o mais leve para o seu PC):

| Jeito                                                             | Comando                                                                     |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------- |
| **A) Tudo com 1 comando** (front + back, sem MySQL, sem IntelliJ) | `npm run dev:full`                                                          |
| B) Backend em terminal separado                                   | na pasta do backend: `./mvnw spring-boot:run -Dspring-boot.run.profiles=h2` |
| C) Backend no IntelliJ                                            | so se o seu PC aguentar (veja `docs/SEM_DOIS_INTELLIJ.md`)                  |

`npm run dev:full` espera o backend clonado **ao lado** deste repositorio, na pasta `BD_3S_BACKEND`:

```
projeto/
  BD_3S_BACKEND/         <- backend
  BD_3S_FRONTEND/   <- este repositorio
```

Se estiver em outro lugar, copie `.env.example` para `.env` e ajuste `BACKEND_DIR`.

## 3. Abrir no celular (mesma rede wi-fi)

```bash
npm run ip           # mostra os enderecos para digitar no celular
npm run dev          # http://IP-DO-PC:5173
npm run dev:https    # https://IP-DO-PC:5173   (celular acessa por https)
```

Nao precisa de login, cadastro nem conta em nada. Passo a passo completo (firewall, aviso de certificado,
tunel https publico): **`docs/REDE_E_CELULAR.md`**.

## 4. Comandos

| Comando             | O que faz                                        |
| ------------------- | ------------------------------------------------ |
| `npm run dev`       | Servidor de desenvolvimento (acessivel na rede)  |
| `npm run dev:https` | Igual, mas com https (certificado autoassinado)  |
| `npm run dev:full`  | Sobe backend (h2) + front juntos                 |
| `npm run ip`        | Mostra o endereco para o celular                 |
| `npm run tunnel`    | https publico temporario, sem conta (opcional)   |
| `npm test`          | Testes (Vitest)                                  |
| `npm run lint`      | Confere o estilo do codigo                       |
| `npm run build`     | Gera a versao de producao (confere tipos tambem) |

**Antes de abrir um PR:** `npm run lint && npm test && npm run build` - os tres tem que passar.

## 5. Como o front fala com o backend

O front **nunca** chama `localhost:8080` direto. Ele chama **`/api/...`** e o Vite repassa ao backend:

```
navegador  ->  /api/ocs  ->  [Vite proxy]  ->  http://localhost:8080/ocs
```

Por isso funciona igual no PC, no celular e no tunel, e nao existe erro de CORS.
Use sempre `get / post / postForm` de `src/shared/api/http.ts`. Detalhes: `docs/ARQUITETURA.md`.

### Login e acesso por perfil

- A tela `/login` confere o CPF (ou nome de usuario) e a senha no backend (`POST /auth/login`).
- Depois do login, cada perfil so abre a propria area (`RotaProtegida`). Quem tenta abrir a area de outro
  perfil volta para o inicio do seu. O botao **Sair**, na barra superior, encerra a sessao.
- O backend continua conferindo o perfil em todos os endpoints (403), entao a protecao nao depende so da tela.

### Acesso rapido para testes e gravacoes

Com `npm run dev`, a tela de login mostra o cartao **Acesso rapido (demonstracao)**, com um botao por perfil.
Cada botao faz o login normal com a conta de exemplo do seed (senha `senha123`):

| Perfil | Login |
|---|---|
| Beneficiario | `52998224725` |
| Medico FUSEX | `11144477735` |
| Chefe do FUSEX | `chefe.fusex` |
| Setor de Guias | `setor.guias` |
| Recepcao | `recepcao` |

Para trocar de usuario, clique em **Sair** e escolha outro perfil. Para testar dois perfis ao mesmo tempo,
use uma janela anonima (cada janela guarda a propria sessao). O cartao fica oculto no build de producao;
para exibi-lo em outro ambiente, defina `VITE_ACESSO_RAPIDO=true`.

Roteiro sugerido para gravar o fluxo completo de uma Guia:

1. **Beneficiario**: Nova pre-guia -> escolher a OCS, anexar o encaminhamento e enviar.
2. **Setor de Guias**: Fila de pre-guias -> Abrir -> informar o numero, anexar o PDF da Guia e Concluir.
3. **Medico FUSEX** e **Chefe do FUSEX**: Minhas informacoes -> cadastrar a assinatura (se ainda nao tiver);
   depois Guias para assinar -> Assinar com minha assinatura.
4. **Beneficiario**: Minhas pre-guias -> a pre-guia aparece como Concluida -> Baixar, Visualizar ou Imprimir.
5. **Recepcao**: Guias para impressao -> buscar pelo nome, Prec CP ou numero da Guia -> Visualizar ou Imprimir.

Fluxo de correcao: no passo 2, use **Requerer correcao** com uma observacao. A pre-guia criada pelo beneficiario
volta para ele em Minhas pre-guias (Visualizar e corrigir); a criada pelo medico aparece para o medico em
Corrigir pre-guias.

## 6. Onde fica cada coisa

```
src/
  App.tsx                    tabela de rotas
  shared/
    api/http.ts              cliente HTTP unico
    api/erros.ts             leitura de erros da API
    types/domain.ts          tipos (Ocs, PreGuia, StatusPreGuia...)
    components/              AppLayout, EmConstrucao, StatusBadge
    hooks/useDebounce.ts     atraso das buscas digitadas
    utils/formatadores.ts    mascaras e formatacao (CPF, Prec CP, telefone, data)
  features/
    diagnostico/             tela "Teste de conexao"
    novaPreGuia/
      api.ts                 chamadas de pre-guia
      ocsApi.ts              chamadas de OCS
      NovaPreGuiaPage/
        index.tsx            container magro (estado + junta os componentes)
        types.ts             estado compartilhado do formulario
        components/          UM ARQUIVO POR PESSOA (SCRUM 23, 24, 35, 36, 38...)
docs/                        guias do time
scripts/                     ip e dev:full
```

## 7. As 6 regras que evitam 90% dos problemas

1. **`git pull origin develop` antes de comecar.** Todo dia.
2. **Procure antes de criar** (Ctrl+Shift+F). Dois arquivos/tipos com o mesmo nome e o nosso maior risco.
3. **Nao edite** `shared/`, `App.tsx`, `NovaPreGuiaPage/index.tsx` ou `types.ts` sem avisar o grupo (PR pequeno, so com isso).
4. **Cada pessoa e dona de um componente/arquivo.** Nunca 2 pessoas no mesmo arquivo.
5. **Branch dura no maximo 2 dias.**
6. **PR so entra com 1 revisor e com lint + test + build passando.**

Mais: `docs/GUIA_GIT.md` - `docs/ARQUITETURA.md` - `docs/CONTRATO_API.md` - `docs/DECISOES_PENDENTES.md`

## 8. Problemas comuns

| Sintoma                                          | O que fazer                                                         |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| `Port 5173 is already in use`                    | Ja tem um `npm run dev` aberto. Feche-o (Ctrl+C no terminal).       |
| Tela "Conexao" diz que nao falou com o backend   | Backend desligado. Rode `npm run dev:full` ou suba o backend.       |
| Tela "Conexao" diz "respondeu, mas com problema" | Backend ligado, mas MySQL parado. Use o perfil `h2` do backend.     |
| Celular nao abre o endereco                      | `docs/REDE_E_CELULAR.md` (firewall / mesma rede).                   |
| `npm install` falha                              | Confira `node -v` (>= 20.19). Apague `node_modules` e rode de novo. |
| Tela em branco                                   | Abra o console do navegador (F12) e leia o erro em vermelho.        |
