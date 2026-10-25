/** Contrato do T14-BE1: GET /medicos/me/pre-guias/para-corrigir */
export interface PreGuiaParaCorrigir {
  id: number
  numero: string
  beneficiarioNome: string
  precCp: string
  ocsNome: string
  /** Data de criação (AAAA-MM-DD ou ISO com horário). */
  dataCriacao: string
  /** Observação mais recente do histórico, registrada pelo setor de Guias. */
  observacao: string
}

export interface CorrigirPreGuiasApi {
  listarParaCorrigir(): Promise<PreGuiaParaCorrigir[]>
}
