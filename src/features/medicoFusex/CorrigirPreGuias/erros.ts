/** Lê o status HTTP de um erro da API sem depender da classe do erro. */
export function statusDoErro(erro: unknown): number | undefined {
  if (typeof erro === 'object' && erro !== null && 'status' in erro) {
    const status = (erro as { status: unknown }).status
    return typeof status === 'number' ? status : undefined
  }
  return undefined
}

export function mensagemDoErro(erro: unknown, padrao: string): string {
  return erro instanceof Error && erro.message ? erro.message : padrao
}
