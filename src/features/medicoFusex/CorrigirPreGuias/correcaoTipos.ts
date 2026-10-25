/** Contratos do T14-BE2 a T14-BE5 */

export interface BeneficiarioCorrecao {
  nome: string
  precCp: string
  faixaEtaria: string
  telefone: string | null
}

export interface OcsResumo {
  id: number
  nome: string
  contrato: string
  tipo: string
}

export interface ProcedimentoResumo {
  codigoTuss: string
  nome: string
}

/** Resposta do GET /medicos/me/pre-guias/{id}/correcao (T14-BE2). O id da pre-guia vem da rota, nao da resposta. */
export interface DetalheCorrecao {
  numero: string
  status: string
  beneficiario: BeneficiarioCorrecao
  ocsAtual: OcsResumo
  procedimentos: ProcedimentoResumo[]
  observacao: { texto: string; dataRegistro: string }
}

export interface ListaOcs {
  resultados: OcsResumo[]
  total: number
}

export interface ReenvioResposta {
  status: string
  dataReenvio: string
}

export interface DadosCorrecao {
  ocsId?: number
  procedimentos: string[]
}

export interface CorrecaoApi {
  detalhar(id: number): Promise<DetalheCorrecao>
  buscarOcs(busca: string): Promise<ListaOcs>
  buscarProcedimentos(busca: string): Promise<ProcedimentoResumo[]>
  salvarCorrecao(id: number, dados: DadosCorrecao): Promise<ReenvioResposta>
}
