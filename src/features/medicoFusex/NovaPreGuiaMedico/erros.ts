import { ApiError } from '../../../shared/api/http'

/** Usa a mensagem da API quando a falha veio dela; senão, o texto padrão da tela. */
export function mensagemDeErro(erro: unknown, padrao: string): string {
  return erro instanceof ApiError ? erro.message : padrao
}
