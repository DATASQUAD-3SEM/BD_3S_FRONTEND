import { get, getBlob, post } from '../../shared/api/http'
import type {
  AssinaturaRegistrada,
  GuiaParaAssinar,
  GuiasParaAssinarApi,
  ModoPdfAssinatura,
} from './types'

/**
 * Chamadas a API da Tela 5 - Guias para assinar (T5-BE1, T5-BE2 e T5-BE3).
 */

export const USAR_MOCK_GUIAS_ASSINAR = false

export const guiasParaAssinarApi: GuiasParaAssinarApi = {
  listar(): Promise<GuiaParaAssinar[]> {
    return get<GuiaParaAssinar[]>('/guias/para-assinar')
  },

  obterPdf(guiaId: number, modo: ModoPdfAssinatura): Promise<Blob> {
    return getBlob(`/guias/${guiaId}/pdf?modo=${modo}`)
  },

  assinar(guiaId: number): Promise<AssinaturaRegistrada> {
    // Sem corpo: o papel vem do perfil do token no backend.
    return post<AssinaturaRegistrada>(`/guias/${guiaId}/assinaturas`, undefined)
  },
}
