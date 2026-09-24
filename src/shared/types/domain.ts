/**
 * TIPOS DO DOMINIO - espelham as entidades do backend (Beneficiario, Ocs, ProcedimentoExame, PreGuia).
 * Nao recrie estes tipos em outro arquivo.
 * PROVISORIO: os controllers/DTOs do backend ainda nao existem. Quando existirem, ajuste aqui.
 * Datas chegam como texto ISO ("2026-09-23" ou "2026-09-23T14:30:00").
 */

export type StatusPreGuia = 'RASCUNHO' | 'PENDENTE' | 'APROVADA' | 'REJEITADA'

export interface Ocs {
  id: number
  contratoNum: string
  nome: string
  tipo: string | null
  inicioVigencia: string | null
  terminoVigencia: string | null
  diasParaVencimento: number | null
}

export interface ProcedimentoExame {
  id: number
  codigoTuss: string
  terminologiaProcedimentoEvento: string
  grupo: string | null
  subgrupo: string | null
  capitulo: string | null
}

export interface PreGuia {
  id: number
  status: StatusPreGuia
  dataEmissao: string
  encaminhamentoUrl: string | null
  ocsId: number
  procedimentoIds: number[]
}
