import { get, getBlob, post } from '../../shared/api/http'
import type { GuiaDoBeneficiario, MinhasGuiasApi } from './types'

export const minhasGuiasApi: MinhasGuiasApi = {
  listar(): Promise<GuiaDoBeneficiario[]> {
    return get<GuiaDoBeneficiario[]>('/guias/minhas')
  },

  // POST: backend identifica a OCS pela pré-guia da própria guia.
  enviar(id: number): Promise<GuiaDoBeneficiario> {
    return post<GuiaDoBeneficiario>(`/guias/${id}/envio`, undefined)
  },

  // T23-FE1: PDF da guia do beneficiario, inline, para o visualizador (T23-BE2).
  obterPdf(id: number): Promise<Blob> {
    return getBlob(`/guias/${id}/pdf`)
  },
}
