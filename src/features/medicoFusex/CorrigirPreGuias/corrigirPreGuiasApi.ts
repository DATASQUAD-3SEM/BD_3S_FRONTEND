import { get } from '../../../shared/api/http'
import { corrigirPreGuiasMock } from './corrigirPreGuiasApi.mock'
import type { CorrigirPreGuiasApi, PreGuiaParaCorrigir } from './types'

/** true = usa o mock em memória (sem backend). */
const USAR_MOCK = false

const corrigirPreGuiasReal: CorrigirPreGuiasApi = {
  listarParaCorrigir() {
    return get<PreGuiaParaCorrigir[]>('/medicos/me/pre-guias/para-corrigir')
  },
}

export const corrigirPreGuiasApi: CorrigirPreGuiasApi = USAR_MOCK
  ? corrigirPreGuiasMock
  : corrigirPreGuiasReal
