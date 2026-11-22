import { get, getBlob } from '../../shared/api/http'
import type { AuditoriaApi, FaturaAuditoriaDetalhe, FaturaAuditoriaResumo } from './types'

export const auditoriaApi: AuditoriaApi = {
  listarFaturas: () => get<FaturaAuditoriaResumo[]>('/auditoria/faturas'),

  detalhar: (id) => get<FaturaAuditoriaDetalhe>(`/auditoria/faturas/${id}`),

  obterPdfGuia: (guiaId) => getBlob(`/auditoria/guias/${guiaId}/pdf`),
}
