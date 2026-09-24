import { postForm } from '../../shared/api/http'
import type { PreGuia } from '../../shared/types/domain'
import type { NovaPreGuiaForm } from './NovaPreGuiaPage/types'

// CONTRATO PROPOSTO (backend: SCRUM 30) - ver docs/CONTRATO_API.md

/** POST /pre-guias (multipart/form-data) */
export function criarPreGuia(form: NovaPreGuiaForm): Promise<PreGuia> {
  const dados = new FormData()
  dados.append('cpf', form.beneficiario.cpf)
  dados.append('precCp', form.beneficiario.precCp)
  if (form.ocsId !== null) dados.append('ocsId', String(form.ocsId))
  form.procedimentoIds.forEach((id) => dados.append('procedimentoIds', String(id)))
  if (form.arquivo) dados.append('arquivo', form.arquivo)
  return postForm<PreGuia>('/pre-guias', dados)
}
