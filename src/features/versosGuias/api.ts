import { get, getBlob } from '../../shared/api/http'

/** Fatura com Guias glosadas com verso disponível (GET /rastreabilidade/versos, T32-BE1). */
export interface VersoFatura {
  faturaId: number
  numeroFatura: string | null
  ocs: string
  situacao: string
  guiasGlosadas: number
  valorGlosa: number
}

/** Guia glosada da fatura (GET /rastreabilidade/versos/{faturaId}). */
export interface VersoGuia {
  guiaId: number
  guiaNumero: string
  paciente: string
  situacaoFinal: string
  seloFinal: string
  glosa: number
}

export interface VersoFaturaDetalhe {
  faturaId: number
  numeroFatura: string | null
  ocs: string
  guias: VersoGuia[]
}

export interface VersosApi {
  listar(): Promise<VersoFatura[]>
  detalhar(faturaId: number): Promise<VersoFaturaDetalhe>
  pdfDaGuia(faturaId: number, guiaId: number): Promise<Blob>
  pdfDaFatura(faturaId: number): Promise<Blob>
}

const BASE = '/rastreabilidade/versos'

export const versosApi: VersosApi = {
  listar: () => get<VersoFatura[]>(BASE),
  detalhar: (faturaId) => get<VersoFaturaDetalhe>(`${BASE}/${faturaId}`),
  pdfDaGuia: (faturaId, guiaId) => getBlob(`${BASE}/${faturaId}/guias/${guiaId}/pdf`),
  pdfDaFatura: (faturaId) => getBlob(`${BASE}/${faturaId}/pdf`),
}
