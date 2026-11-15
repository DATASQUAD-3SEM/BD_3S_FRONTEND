import { delComCorpo, get, getBlob, post, put } from '../../shared/api/http'
import type { Espelho, GuiaFinalizada, ValorProcedimento } from './types'

function paraCorpo(valores: ValorProcedimento[]) {
  return valores.map((valor) => ({ cod_dgp: valor.codDgp, valor_sessao: valor.valorSessao }))
}

export const espelhoApi = {
  buscarEmConstrucao(): Promise<Espelho> {
    return get<Espelho>('/ocs/espelho')
  },
  adicionarGuia(guiaId: number, valores: ValorProcedimento[]): Promise<Espelho> {
    return post<Espelho>(`/ocs/espelho/guias/${guiaId}`, paraCorpo(valores))
  },
  editarValores(guiaId: number, valores: ValorProcedimento[]): Promise<Espelho> {
    return put<Espelho>(`/ocs/espelho/guias/${guiaId}`, paraCorpo(valores))
  },
  removerGuias(guiaIds: number[]): Promise<Espelho> {
    return delComCorpo<Espelho>('/ocs/espelho/guias', guiaIds)
  },
  enviar(): Promise<Espelho> {
    return post<Espelho>('/ocs/espelho/enviar', {})
  },
  listarHistorico(): Promise<Espelho[]> {
    return get<Espelho[]>('/ocs/espelho/historico')
  },
}

export const guiasFinalizadasApi = {
  listar(): Promise<GuiaFinalizada[]> {
    return get<GuiaFinalizada[]>('/ocs/guias-finalizadas')
  },
  obterPdf(guiaId: number): Promise<Blob> {
    return getBlob(`/ocs/guias/${guiaId}/pdf`)
  },
}
