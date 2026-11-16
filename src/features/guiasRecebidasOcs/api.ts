import { get, post } from '../../shared/api/http';
import type { GuiaRecebida, GuiaRecebidaDetalhe } from './types';

export const guiasRecebidasApi = {
  listar(): Promise<GuiaRecebida[]> {
    return get<GuiaRecebida[]>('/ocs/guias');
  },
  /** T19-BE2: modelo digitalizado da guia. 404 se a guia nao e desta OCS ou nao esta na lista. */
  buscarDetalhe(id: number): Promise<GuiaRecebidaDetalhe> {
    return get<GuiaRecebidaDetalhe>(`/ocs/guias/${id}`);
  },
  /**
   * T19-BE3: requer a assinatura de uma sessao disponivel. Devolve o detalhe atualizado.
   * 403: guia de outra OCS. 409: guia vencida ou sessao nao disponivel.
   */
  solicitarAssinatura(guiaId: number, sessaoId: number): Promise<GuiaRecebidaDetalhe> {
    return post<GuiaRecebidaDetalhe>(`/ocs/guias/${guiaId}/sessoes/${sessaoId}/solicitacao`, undefined);
  },
};
