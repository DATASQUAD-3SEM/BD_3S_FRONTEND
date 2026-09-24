import { get } from '../../shared/api/http'
import type { Ocs, ProcedimentoExame } from '../../shared/types/domain'

// CONTRATO PROPOSTO (backend ainda nao implementou - ver docs/CONTRATO_API.md)

/** GET /ocs */
export function listarOcs(): Promise<Ocs[]> {
  return get<Ocs[]>('/ocs')
}

/** GET /ocs/{id}/procedimentos - exames que a OCS realiza */
export function listarProcedimentosDaOcs(ocsId: number): Promise<ProcedimentoExame[]> {
  return get<ProcedimentoExame[]>(`/ocs/${ocsId}/procedimentos`)
}
