# Arquitetura do front

## Organizacao por FEATURE
Cada pasta em `src/features/` e um assunto (preguia, ocs, ...). Quem e dono da feature mexe nos proprios arquivos.

## O que e COMPARTILHADO (ja pronto - nao recrie)

| Arquivo | Serve para |
|---|---|
| `shared/api/http.ts` | `get`, `post`, `postForm`, `del`, `ApiError`. Toda chamada ao backend passa aqui |
| `shared/types/domain.ts` | Tipos `Ocs`, `ProcedimentoExame`, `PreGuia`, `StatusPreGuia` |
| `shared/components/AppLayout.tsx` | Cabecalho + menu |
| `shared/components/EmConstrucao.tsx` | Marcador temporario |
| `App.tsx` | Tabela de rotas |
| `features/preguia/NovaPreGuiaPage/types.ts` | Estado do formulario da pre-guia |

## Regras de ouro
1. **Chamada ao backend so em arquivos `api.ts`** da feature, usando `shared/api/http.ts`. Nunca `fetch` dentro de componente.
2. **Todo caminho de API comeca sem `/api`** dentro do codigo: `get('/ocs')`. O prefixo e colocado pelo `http.ts`.
3. **Erro:** `catch (e)` e `e instanceof ApiError` -> mostre `e.message` (e `e.detalhes`, se houver).
   - `e.semResposta === true` = backend desligado / sem rede.
4. **Componente = 1 arquivo**, recebe `value` e `onChange` (ou props), e nao conhece os outros componentes.
5. **Tela nova:** crie `features/<nome>/`, e adicione UMA linha em `App.tsx` + UMA em `AppLayout.tsx` (PR pequeno).
6. **Nada de `senha` na tela ou em log.**

## A tela Nova Pre-guia (SCRUM 33)
`NovaPreGuiaPage/index.tsx` e um **container magro**: guarda o estado (`useState`) e monta os componentes.
Cada componente em `components/` e de uma pessoa:

| Componente | Task | O que recebe |
|---|---|---|
| `DadosBeneficiario` | - | `value/onChange` dos dados pessoais |
| `SelecaoOcs` | SCRUM 35 | `value/onChange` (id da OCS) |
| `SelecaoProcedimentos` | SCRUM 36 | `ocsId`, `value/onChange` (ids) |
| `UploadEncaminhamento` | SCRUM 23 | `value/onChange` (File) |
| `FeedbackUpload` | SCRUM 24 | `arquivo` |
| `RevisaoResumo` | SCRUM 38 | `form` inteiro (so leitura) |

Precisa de um dado novo no formulario? Altere `types.ts` em **PR proprio, pequeno**, avise o grupo, e so entao use.

## Mapa das tasks do PDF de reorganizacao

| Task (depois da reorganizacao) | Onde no front |
|---|---|
| 33 - container magro | `NovaPreGuiaPage/index.tsx` (ja pronto) |
| 35, 36, 38 | componentes acima |
| 23, 24 - upload e feedback | componentes acima |
| 37 - validacao em tela (inline) | dentro de cada componente + regra de bloqueio no container |
| 28 - bloquear sem arquivo | `UploadEncaminhamento` / botao Enviar |
| Removidas (20, 21, 25, 34, 39) | **nao existem mais**: nao ha tela nem lista de encaminhamentos |

O encaminhamento **nao e entidade**: e so o arquivo enviado junto da pre-guia (URGENTE.pdf).

## Testes (Vitest + Testing Library)
- Arquivo de teste fica ao lado do codigo: `Coisa.tsx` -> `Coisa.test.tsx`.
- Para simular o backend: `vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({...}))))`.
  Modelos: `shared/api/http.test.ts` e `features/diagnostico/ConexaoPage.test.tsx`.
