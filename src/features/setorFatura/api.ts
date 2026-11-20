// Cliente HTTP real do Setor de Faturas (T24-FE1). Contratos: T24-BE2 (listar) e detalhe.
import { get } from '../../shared/api/http'
import type { EspelhoDetalhe, EspelhoResumo, SetorFaturasApi } from './types'

export const setorFaturasApi: SetorFaturasApi = {
  listarEspelhosRecebidos: () => get<EspelhoResumo[]>('/setor-fatura/faturas'),

  detalharEspelho: (id) => get<EspelhoDetalhe>(`/setor-fatura/faturas/${id}`),
}
