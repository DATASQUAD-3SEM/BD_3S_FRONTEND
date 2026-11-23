import { ApiError, getBlob } from '../../../shared/api/http'

/**
 * Imagem da assinatura atual do usuario logado (T37-BE3).
 * Contrato: GET /usuarios/me/assinatura -> 200 image/png (900 x 300, ja normalizada pelo servidor).
 * Quem ainda nao cadastrou recebe 404 ("Assinatura não cadastrada."), que aqui vira null.
 * Qualquer outro erro (rede, 403, 5xx) continua sendo lancado.
 */
export async function buscarAssinaturaAtual(): Promise<Blob | null> {
  try {
    return await getBlob('/usuarios/me/assinatura')
  } catch (erro: unknown) {
    if (erro instanceof ApiError && erro.status === 404) return null
    throw erro
  }
}
