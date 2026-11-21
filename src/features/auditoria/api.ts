import { get, getBlob } from '../../shared/api/http'
import type { FaturaLisuraDetalhe } from '../rastreabilidade/types'
import type { AuditoriaApi, FaturaAuditoriaResumo } from './types'

export const auditoriaApi: AuditoriaApi = {
  listarFaturas: () => get<FaturaAuditoriaResumo[]>('/auditoria/faturas'),

  detalhar: (id) => get<FaturaLisuraDetalhe>(`/auditoria/faturas/${id}`),

  obterPdfGuia: (guiaId) => getBlob(`/auditoria/guias/${guiaId}/pdf`),
}
