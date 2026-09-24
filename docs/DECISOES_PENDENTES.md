# Decisoes pendentes (front)

| # | Assunto | Situacao |
|---|---|---|
| 1 | **Como identificar o beneficiario sem login.** O backend ainda nao tem login/JWT. A proposta usa CPF + Prec-CP enviados no formulario; a tabela `pre_guia` exige `beneficiario_id`. | Definir com PO/back |
| 2 | **Contrato de `/ocs` e `/pre-guias`** (ver `CONTRATO_API.md`) | Proposta minha; back precisa confirmar |
| 3 | **Fluxo do medico do FUSEX** (gera a pre-guia na consulta) e do **funcionario do FUSEX** (aprova) | Sem tela nem perfil ainda |
| 4 | **Assinatura digital no cadastro** | Sem definicao; nao ha tela de cadastro |
| 5 | **Tipos em `domain.ts`** sao provisorios (baseados nas entidades Java, nao em DTOs) | Ajustar quando os DTOs existirem |
| 6 | **Componente `DadosBeneficiario`**: nao havia dono/task no PDF | Atribuir |
| 7 | **PDF de pautas:** a pagina 2 (P3 a P5) nao veio nos anexos | Conferir se ha algo de front la |

## Verificado nesta base (no ambiente de geracao)
- `npm install`, `tsc`, `eslint`, `vitest` (9 testes) e `vite build`: passaram.
- Servidor de dev: proxy `/api` -> backend, acesso por IP da rede, `dev:https` (certificado autoassinado) e bloqueio de hosts desconhecidos: testados com um backend falso.

## NAO verificado
- Acesso de um celular de verdade (nao havia aparelho).
- `npm run tunnel` (o `cloudflared` instala e roda, mas o tunel depende da internet da Cloudflare).
- `npm run dev:full` com o backend real (so testado com um `mvnw` de mentira; o backend real nao foi compilado ainda).
- Windows (scripts foram escritos para funcionar, mas testados so em Linux).
