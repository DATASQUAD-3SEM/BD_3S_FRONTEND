# Contrato Front <-> Back

Como o front espera conversar com o backend. Itens marcados **PROPOSTA** ainda **nao existem** no backend:
combinem com quem faz o backend (SCRUM 29, 30) e atualizem este arquivo.

Regra geral: no codigo do front os caminhos NAO levam `/api` (o `http.ts` coloca). O backend recebe sem `/api`.

## Existe hoje
| Metodo | Caminho no backend | Uso |
|---|---|---|
| GET | `/actuator/health` | Teste de conexao. Resposta `{"status":"UP"}` (HTTP 503 se o banco cair) |

## Formato de erro (ja implementado no backend)
```json
{ "status": 400, "erro": "Bad Request", "mensagem": "Dados invalidos", "detalhes": ["cpf: nao pode ser vazio"], "timestamp": "..." }
```
Vira `ApiError` no front (`message` = `mensagem`, `detalhes` = `detalhes`).

## PROPOSTA (SCRUM 29 - OCS)
| Metodo | Caminho | Resposta |
|---|---|---|
| GET | `/ocs` | `Ocs[]` |
| GET | `/ocs/{id}/procedimentos` | `ProcedimentoExame[]` (so o que aquela OCS realiza) |

## PROPOSTA (SCRUM 30 - criar pre-guia)
`POST /pre-guias` como **multipart/form-data**:

| Parte | Tipo | Observacao |
|---|---|---|
| `cpf` | texto | identifica o beneficiario |
| `precCp` | texto | identifica o beneficiario |
| `ocsId` | numero | OCS escolhida |
| `procedimentoIds` | numero, **repetido** | um por exame; todos tem que ser da OCS |
| `arquivo` | arquivo | encaminhamento (PDF/JPG/PNG, ate 10 MB) |

Resposta: `PreGuia` (`id`, `status`, `dataEmissao`, `encaminhamentoUrl`, `ocsId`, `procedimentoIds`).

O que o front ja faz: `features/preguia/api.ts` (`criarPreGuia`). Se o contrato mudar, so esse arquivo muda.
