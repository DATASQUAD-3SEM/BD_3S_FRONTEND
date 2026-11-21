import { get } from '../../shared/api/http'
import type { AuditoriaApi, FaturaAuditoriaResumo } from './types'

export const auditoriaApi: AuditoriaApi = {
  listarFaturas: () => get<FaturaAuditoriaResumo[]>('/auditoria/faturas'),
}
