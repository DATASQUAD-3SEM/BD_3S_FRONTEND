import { get, getBlob, post } from '../../shared/api/http'
import type { FaturaLisuraDetalhe } from '../rastreabilidade/types'
import type { AuditoriaApi, FaturaAnalisadaResumo, FaturaAuditoriaDetalhe, FaturaAuditoriaResumo } from './types'

export const auditoriaApi: AuditoriaApi = {
  listarFaturas: () => get<FaturaAuditoriaResumo[]>('/auditoria/faturas'),

  listarAnalisadas: () => get<FaturaAnalisadaResumo[]>('/auditoria/faturas/analisadas'),

  detalhar: (id) => get<FaturaAuditoriaDetalhe>(`/auditoria/faturas/${id}`),

  obterPdfGuia: (guiaId) => getBlob(`/auditoria/guias/${guiaId}/pdf`),

  visualizar: (id, responsavel) => post<FaturaLisuraDetalhe>(`/auditoria/faturas/${id}/visualizar`, { responsavel }),
}
