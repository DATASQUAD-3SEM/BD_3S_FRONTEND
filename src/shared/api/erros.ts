/**
 * Leitura dos erros lancados pelas chamadas a API (ver ApiError em http.ts).
 * As funcoes aceitam "unknown" porque o catch do JavaScript nao garante o tipo do erro.
 */

/** Le o status HTTP de um erro da API sem depender da classe do erro. */
export function statusDoErro(erro: unknown): number | undefined {
  if (typeof erro === 'object' && erro !== null && 'status' in erro) {
    const status = (erro as { status: unknown }).status
    return typeof status === 'number' ? status : undefined
  }
  return undefined
}

/** Usa a mensagem do erro quando ela existe; senao, o texto padrao informado pela tela. */
export function mensagemDeErro(erro: unknown, padrao: string): string {
  return erro instanceof Error && erro.message ? erro.message : padrao
}
