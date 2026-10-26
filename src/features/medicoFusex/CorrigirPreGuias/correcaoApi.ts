import { get, put } from '../../../shared/api/http'
import { correcaoMock } from './correcaoApi.mock'
import type {
  CorrecaoApi,
  DetalheCorrecao,
  ListaOcs,
  ProcedimentoResumo,
  ReenvioResposta,
} from './correcaoTipos'

/** true = usa o mock em memória (sem backend). */
const USAR_MOCK = false

const BASE = '/medicos/me/pre-guias'

const correcaoReal: CorrecaoApi = {
  detalhar(id) {
    return get<DetalheCorrecao>(`${BASE}/${id}/correcao`)
  },
  buscarOcs(busca) {
    return get<ListaOcs>(`/medicos/me/ocs?busca=${encodeURIComponent(busca)}`)
  },
  buscarProcedimentos(busca) {
    return get<ProcedimentoResumo[]>(`/medicos/me/procedimentos?busca=${encodeURIComponent(busca)}`)
  },
  salvarCorrecao(id, dados) {
    return put<ReenvioResposta>(`${BASE}/${id}/correcao`, dados)
  },
}

export const correcaoApi: CorrecaoApi = USAR_MOCK ? correcaoMock : correcaoReal
