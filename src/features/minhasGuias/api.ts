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

  // POST: a sessão precisa estar SOLICITADA (validação no backend, T18-BE-3).
  assinar(idGuia: number, idSessao: number): Promise<GuiaDoBeneficiario> {
    return post<GuiaDoBeneficiario>(
      `/guias/${idGuia}/sessoes/${idSessao}/assinatura`,
      undefined,
    )
  },
}