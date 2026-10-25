import { get, getBlob } from '../../shared/api/http'
import type { GuiaRecepcao, GuiasRecepcaoApi, ModoPdfGuia } from './types'

/**
 * Chamadas a API da Tela 6 - Guias para impressao (T6-BE1 e T6-BE2).
 */

export const guiasRecepcaoApi: GuiasRecepcaoApi = {
  buscar(busca: string): Promise<GuiaRecepcao[]> {
    return get<GuiaRecepcao[]>(`/recepcao/guias?busca=${encodeURIComponent(busca)}`)
  },

  obterPdf(guiaId: number, modo: ModoPdfGuia): Promise<Blob> {
    return getBlob(`/recepcao/guias/${guiaId}/pdf?modo=${modo}`)
  },
}
