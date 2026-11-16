import { get } from '../../shared/api/http';
import type { GuiaRecebida } from './types';

export const guiasRecebidasApi = {
  listar(): Promise<GuiaRecebida[]> {
    return get<GuiaRecebida[]>('/ocs/guias');
  },
};
