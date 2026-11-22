/**
 * Tipos da Nova pre-guia do beneficiario: estado do formulario e contratos de
 * GET /beneficiarios/me/ocs e POST /pre-guias.
 */

/** OCS ativa devolvida pela busca do beneficiario. */
export interface OcsOpcao {
  id: number
  nome: string
  contrato: string
  tipo: string
}

/** Resposta do POST /pre-guias. */
export interface PreGuiaCriada {
  id: number
  numero: string
  status: string
  dataCriacao: string
  ocsId: number
}

/**
 * Paciente possivel para a pre-guia (PacienteResponse, T30-BE2). dependenteId nulo = o proprio titular. Os demais
 * campos alimentam o bloco "Dados do paciente" (T30-FE1).
 */
export interface PacienteOpcao {
  dependenteId: number | null
  nome: string
  relacao: string
  dataNascimento?: string | null
  idade?: number | null
  faixaEtaria?: string | null
  precCp?: string | null
  cpf?: string | null
  telefone?: string | null
}

export interface NovaPreGuiaForm {
  ocs: OcsOpcao | null
  arquivo: File | null
  /** Paciente escolhido no passo 1; nulo = o proprio titular. */
  dependenteId?: number | null
}

export const formVazio: NovaPreGuiaForm = {
  ocs: null,
  arquivo: null,
}
