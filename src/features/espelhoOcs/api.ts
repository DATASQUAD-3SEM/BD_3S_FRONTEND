import { get } from '../../shared/api/http'
import type { Espelho } from './types'

export const espelhoApi = {
  buscarEmConstrucao(): Promise<Espelho> {
    return get<Espelho>('/ocs/espelho')
  },
}
