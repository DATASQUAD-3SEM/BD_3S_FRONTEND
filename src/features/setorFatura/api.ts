// Cliente HTTP real do Setor de Faturas (T24-FE1). Contratos: T24-BE2 (listar) e detalhe.
import { get, post } from '../../shared/api/http'
import type {
  EnviarLisuraRequest,
  EspelhoDetalhe,
  EspelhoResumo,
  ProtocolarFaturaRequest,
  SetorFaturasApi,
} from './types'

export const setorFaturasApi: SetorFaturasApi = {
  listarEspelhosRecebidos: () => get<EspelhoResumo[]>('/setor-fatura/faturas'),

  detalharEspelho: (id) => get<EspelhoDetalhe>(`/setor-fatura/faturas/${id}`),

  proximoNumeroFatura: async (id) => {
    const resposta = await get<{ numeroFatura: string }>(`/setor-fatura/faturas/${id}/proximo-numero`)
    return resposta.numeroFatura
  },

  protocolarFatura: (id, corpo: ProtocolarFaturaRequest) =>
    post<EspelhoDetalhe>(`/setor-fatura/faturas/${id}/protocolo`, corpo),

  enviarParaLisura: (id, corpo: EnviarLisuraRequest) =>
    post<EspelhoDetalhe>(`/setor-fatura/faturas/${id}/enviar-lisura`, corpo),
}
