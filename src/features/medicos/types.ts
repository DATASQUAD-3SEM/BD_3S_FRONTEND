import type { DadosBeneficiarioForm } from '../preguia/NovaPreGuiaPage/types'

export interface MedicoLogado {
  nome: string
  patente: string
  crm: string
  cpf: string
  precCp: string
}

/** Resultado da busca por Prec-CP: id do beneficiario + dados no mesmo formato do DadosBeneficiario. */
export interface BeneficiarioEncontrado {
  id: number
  dados: DadosBeneficiarioForm
}

export interface ProcedimentoOpcao {
  id: number
  codigoTuss: string
  terminologiaProcedimento: string
  rolAns: 'SIM' | 'NAO'
  subgrupo: string
}

/** Pre-guia criada pelo medico: sem encaminhamento, com medico_id e >= 1 procedimento. */
export interface PreGuiaMedicoPayload {
  beneficiarioId: number
  ocsId: number
  procedimentoIds: number[]
}

/** Pre-guia em ATENCAO emitida pelo medico logado (regra 11 do modelo logico). */
export interface PreGuiaParaCorrecao {
  id: number
  dataCriacao: string
  beneficiario: BeneficiarioEncontrado
  ocsId: number
  procedimentos: ProcedimentoOpcao[]
  observacao: string
}

/** Correcao: so OCS e/ou exames. A pre-guia volta para PENDENTE. */
export interface CorrecaoPayload {
  ocsId: number
  procedimentoIds: number[]
}

export interface PreGuiaCriada {
  id: number
  status: 'PENDENTE'
}
