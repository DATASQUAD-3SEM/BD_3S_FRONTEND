import { get, getBlob } from '../../shared/api/http'
import type { GuiaRecepcao, GuiasRecepcaoApi, ModoPdfGuia } from './types'

export const guiasRecepcaoApi: GuiasRecepcaoApi = {
  buscar(busca: string): Promise<GuiaRecepcao[]> {
    return get<GuiaRecepcao[]>(`/recepcao/guias?busca=${encodeURIComponent(busca)}`)
  },

  obterPdf(guiaId: number, modo: ModoPdfGuia): Promise<Blob> {
    return getBlob(`/recepcao/guias/${guiaId}/pdf?modo=${modo}`)
  },
}
