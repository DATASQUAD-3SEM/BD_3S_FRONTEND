import { postForm } from '../../shared/api/http'
import type { NovaPreGuiaForm, PreGuiaCriada } from './NovaPreGuiaPage/types'

/**
 * Chamada a API da Nova pre-guia do beneficiario: POST /pre-guias (multipart com ocsId e arquivo).
 * O beneficiario nao e enviado: o backend usa sempre o usuario logado.
 */
export function criarPreGuia(form: NovaPreGuiaForm): Promise<PreGuiaCriada> {
  const dados = new FormData()

  if (form.ocs) {
    dados.append('ocsId', String(form.ocs.id))
  }

  if (form.arquivo) {
    dados.append('arquivo', form.arquivo)
  }

  return postForm<PreGuiaCriada>('/pre-guias', dados)
}
