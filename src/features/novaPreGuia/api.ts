import { get, postForm } from '../../shared/api/http'
import type { NovaPreGuiaForm, PacienteOpcao, PreGuiaCriada } from './NovaPreGuiaPage/types'

/**
 * Chamada a API da Nova pre-guia do beneficiario: POST /pre-guias (multipart com ocsId, dependenteId opcional e
 * arquivo). O beneficiario nao e enviado: o backend usa sempre o usuario logado.
 */
export function criarPreGuia(form: NovaPreGuiaForm): Promise<PreGuiaCriada> {
  const dados = new FormData()

  if (form.ocs) {
    dados.append('ocsId', String(form.ocs.id))
  }

  if (form.dependenteId != null) {
    dados.append('dependenteId', String(form.dependenteId))
  }

  if (form.arquivo) {
    dados.append('arquivo', form.arquivo)
  }

  return postForm<PreGuiaCriada>('/pre-guias', dados)
}

/** Pacientes para quem o usuario pode criar pre-guia (GET /pre-guias/pacientes, T30-BE2). */
export function listarPacientes(): Promise<PacienteOpcao[]> {
  return get<PacienteOpcao[]>('/pre-guias/pacientes')
}
