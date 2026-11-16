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

  // T23-FE1: modo visualizar devolve o PDF para exibir no visualizador (inline).
  obterPdf(preGuiaId: number): Promise<Blob> {
    return getBlob(`/beneficiarios/me/pre-guias/${preGuiaId}/guia/pdf?modo=visualizar`)
  },
}
