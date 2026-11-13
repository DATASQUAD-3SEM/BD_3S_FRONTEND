export type SituacaoGuia =
  | 'NAO_ENVIADA'
  | 'ENVIADA'
  | 'EM_EXECUCAO'
  | 'REALIZADA'
  | 'ENCERRADA'
  | 'VENCIDA'

export type SituacaoSessao =
  | 'DISPONIVEL'
  | 'SOLICITADA'
  | 'ASSINADA'
  | 'EXPIRADA'

export interface OcsDaGuia {
  id: number
  nome: string
}

export interface ProcedimentoDaGuia {
  codDgp: string
  descricao: string
  quantidade: number
}

export interface SessaoDaGuia {
  id: number
  /** Código DGP do procedimento a que a sessão pertence. */
  procedimento: string
  numero: number
  status: SituacaoSessao
  dataSolicitacao: string | null
  dataAssinatura: string | null
}

export interface GuiaDoBeneficiario {
  id: number
  numero: string
  ocs: OcsDaGuia
  /** Data-limite lida do PDF ("NÃO RECEBER APÓS"). Formato AAAA-MM-DD. */
  validadeAte: string
  /** ISO datetime. Nulo enquanto a guia está NAO_ENVIADA. */
  dataEnvio: string | null
  situacao: SituacaoGuia
  procedimentos: ProcedimentoDaGuia[]
  sessoes: SessaoDaGuia[]
}

export interface MinhasGuiasApi {
  /** GET /guias/minhas — o backend já devolve da mais recente para a mais antiga. */
  listar(): Promise<GuiaDoBeneficiario[]>
}