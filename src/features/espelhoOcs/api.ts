import { get, getBlob, post } from '../../shared/api/http'
import type { Espelho, GuiaFinalizada, ValorProcedimento } from './types'

export const espelhoApi = {
  buscarEmConstrucao(): Promise<Espelho> {
    return get<Espelho>('/ocs/espelho')
  },
  adicionarGuia(guiaId: number, valores: ValorProcedimento[]): Promise<Espelho> {
    return post<Espelho>(
      `/ocs/espelho/guias/${guiaId}`,
      valores.map((valor) => ({ cod_dgp: valor.codDgp, valor_sessao: valor.valorSessao })),
    )
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
