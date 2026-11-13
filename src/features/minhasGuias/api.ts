import { get } from '../../shared/api/http'
import type { GuiaDoBeneficiario, MinhasGuiasApi } from './types'

export const minhasGuiasApi: MinhasGuiasApi = {
  listar(): Promise<GuiaDoBeneficiario[]> {
    return get<GuiaDoBeneficiario[]>('/guias/minhas')
  },
}