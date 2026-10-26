import { get } from '../../shared/api/http'
import type { OcsOpcao } from './NovaPreGuiaPage/types'

/**
 * Busca de OCS ativas do beneficiario: GET /beneficiarios/me/ocs?busca= (por nome, contrato ou tipo).
 * Sem termo, o backend devolve a lista inicial em ordem alfabetica (no maximo 30).
 */
export function buscarOcs(busca: string): Promise<OcsOpcao[]> {
  const termo = busca.trim()
  const query = termo ? `?busca=${encodeURIComponent(termo)}` : ''
  return get<OcsOpcao[]>(`/beneficiarios/me/ocs${query}`)
}
