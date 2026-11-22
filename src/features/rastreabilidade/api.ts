import { get } from '../../shared/api/http'
import type { FaturaLisuraResumo, RastreabilidadeApi } from './types'

export const rastreabilidadeApi: RastreabilidadeApi = {
  listarFaturas: () => get<FaturaLisuraResumo[]>('/rastreabilidade/faturas'),
}
