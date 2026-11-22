import { get, getBlob, put } from '../../shared/api/http'
import type { FaturaLisuraDetalhe, FaturaLisuraResumo, ItemLisuraPedido, LisuraApi, RastreabilidadeApi } from './types'

export const rastreabilidadeApi: RastreabilidadeApi = {
  listarFaturas: () => get<FaturaLisuraResumo[]>('/rastreabilidade/faturas'),
}

export const lisuraApi: LisuraApi = {
  detalhar: (id) => get<FaturaLisuraDetalhe>(`/rastreabilidade/faturas/${id}`),

  salvarLisura: (id, responsavel, itens: ItemLisuraPedido[]) => {
    const query = responsavel ? `?responsavel=${encodeURIComponent(responsavel)}` : ''
    return put<FaturaLisuraDetalhe>(`/rastreabilidade/faturas/${id}/lisura${query}`, itens)
  },

  obterPdfGuia: (guiaId) => getBlob(`/rastreabilidade/guias/${guiaId}/pdf`),
}
