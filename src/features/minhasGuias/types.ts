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
  /** Nome da OCS da pré-guia (o backend devolve só o nome, como texto). */
  ocs: string
  /** Data-limite lida do PDF ("NÃO RECEBER APÓS"). Formato AAAA-MM-DD. Null em guias antigas até a T16-BE3 rodar o backfill. */
  validadeAte: string | null
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