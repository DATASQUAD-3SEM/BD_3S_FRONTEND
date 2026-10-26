// Cliente HTTP real. Contrato: T3-BE1 (GET /setor-guias/pre-guias).
// Passa pelo cliente unico (shared/api/http): prefixo /api do proxy e header X-Usuario-Login.
import { get } from '../../shared/api/http';
import type { ConsultaFila, FilaPreGuiasApi, PaginaFila, StatusPreGuia } from './types';

// O backend aceita o status pelo rotulo ("Pendente", "Em análise", "Atenção", "Concluída"),
// sem diferenciar maiusculas e acentos; o codigo EM_ANALISE nao e aceito (400).
const ROTULO_STATUS: Record<StatusPreGuia, string> = {
  PENDENTE: 'Pendente',
  EM_ANALISE: 'Em análise',
  ATENCAO: 'Atenção',
  CONCLUIDA: 'Concluída',
};

export const filaPreGuiasApi: FilaPreGuiasApi = {
  /** Retorna { total, pagina, tamanho, itens }. `status` vazio = todos. */
  listar({ busca = '', status = '', page = 0, size = 10 }: ConsultaFila = {}): Promise<PaginaFila> {
    const params = new URLSearchParams();
    if (busca.trim()) params.set('busca', busca.trim());
    if (status) params.set('status', ROTULO_STATUS[status]);
    params.set('page', String(page));
    params.set('size', String(size));

    return get<PaginaFila>(`/setor-guias/pre-guias?${params}`);
  },
};
