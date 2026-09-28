import { postForm } from '../../shared/api/http'
import type { PreGuia } from '../../shared/types/domain'
import type { NovaPreGuiaForm } from './NovaPreGuiaPage/types'

// O backend compara string exata (ver PreGuiaService.identificarBeneficiario), entao
// cpf/precCp precisam ir como digitos, sem pontos/tracos, iguais ao que esta no banco.
function somenteDigitos(texto: string): string {
  return texto.replace(/\D/g, '')
}

/** POST /pre-guias (multipart/form-data) */
export function criarPreGuia(form: NovaPreGuiaForm): Promise<PreGuia> {
  const dados = new FormData()
  dados.append('cpf', somenteDigitos(form.beneficiario.cpf))
  dados.append('precCp', somenteDigitos(form.beneficiario.precCp))
  if (form.ocsId !== null) dados.append('ocsId', String(form.ocsId))
  if (form.arquivo) dados.append('arquivo', form.arquivo)
  return postForm<PreGuia>('/pre-guias', dados)
}
