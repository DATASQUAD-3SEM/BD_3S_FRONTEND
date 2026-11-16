import { get } from '../../shared/api/http';
import type { GuiaRecebida, GuiaRecebidaDetalhe } from './types';

export const guiasRecebidasApi = {
  listar(): Promise<GuiaRecebida[]> {
    return get<GuiaRecebida[]>('/ocs/guias');
  },
  /** T19-BE2: modelo digitalizado da guia. 404 se a guia nao e desta OCS ou nao esta na lista. */
  buscarDetalhe(id: number): Promise<GuiaRecebidaDetalhe> {
    return get<GuiaRecebidaDetalhe>(`/ocs/guias/${id}`);
  },
};
