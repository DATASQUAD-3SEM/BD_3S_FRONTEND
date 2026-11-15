export interface ItemEspelho {
  guiaId: number
  numeroGuia: string
  paciente: string
  codDgp: string
  descricao: string
  quantidadeSessoes: number
  valorSessao: number
  valorTotal: number
}

export interface Espelho {
  id: number | null
  dataInicio: string | null
  dataEnvio: string | null
  itens: ItemEspelho[]
  valorTotal: number
}

export type SituacaoFinalizada = 'REALIZADA' | 'ENCERRADA'

export type VinculoEspelho = 'DISPONIVEL' | 'EM_CONSTRUCAO' | 'ENVIADA'

export interface ProcedimentoFinalizado {
  codDgp: string
  descricao: string
  quantidade: number
  quantidadeAssinadas: number
}

export interface GuiaFinalizada {
  id: number
  numero: string
  beneficiario: { nome: string; precCp: string }
  procedimentos: ProcedimentoFinalizado[]
  dataEnvio: string
  situacao: SituacaoFinalizada
  vinculo: VinculoEspelho
  idEspelho: number | null
}

export interface ValorProcedimento {
  codDgp: string
  valorSessao: number
}
