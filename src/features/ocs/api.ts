import { get } from '../../shared/api/http'
import type { Ocs } from '../../shared/types/domain'

/** GET /ocs */
export function listarOcs(): Promise<Ocs[]> {
  return get<Ocs[]>('/ocs')
}
