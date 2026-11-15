import { get, post } from '../../shared/api/http'
import type { GuiaDoBeneficiario, MinhasGuiasApi } from './types'

export const minhasGuiasApi: MinhasGuiasApi = {
  listar(): Promise<GuiaDoBeneficiario[]> {
    return get<GuiaDoBeneficiario[]>('/guias/minhas')
  },

  // POST: backend identifica a OCS pela pré-guia da própria guia.
  enviar(id: number): Promise<GuiaDoBeneficiario> {
    return post<GuiaDoBeneficiario>(`/guias/${id}/envio`, undefined)
  },
}
