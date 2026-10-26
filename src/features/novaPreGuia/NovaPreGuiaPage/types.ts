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

export interface NovaPreGuiaForm {
  ocs: OcsOpcao | null
  arquivo: File | null
}

export const formVazio: NovaPreGuiaForm = {
  ocs: null,
  arquivo: null,
}
