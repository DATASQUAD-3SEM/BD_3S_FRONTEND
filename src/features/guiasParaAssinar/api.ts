import { get, getBlob, post } from '../../shared/api/http'
import type {
  AssinaturaLoteResultado,
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

  assinarLote(guiaIds: number[]): Promise<AssinaturaLoteResultado> {
    // 200 sem falhas e 207 com falhas: o cliente HTTP devolve o corpo nos dois casos
    return post<AssinaturaLoteResultado>('/guias/assinar-lote', { guiaIds })
  },
}
