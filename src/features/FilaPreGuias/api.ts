// Cliente HTTP real. Contrato: T3-BE1 (GET /setor-guias/pre-guias).
// O token de autenticação deve ser incluído em `cabecalhos()` quando a autenticação existir.
import type { ConsultaFila, FilaPreGuiasApi, PaginaFila } from './types';

const BASE_URL: string = import.meta.env?.VITE_API_URL ?? '';

function cabecalhos(): HeadersInit {
  return {};
}

export const filaPreGuiasApi: FilaPreGuiasApi = {
  /** Retorna { total, pagina, tamanho, itens }. `status` vazio = todos. */
  async listar({ busca = '', status = '', page = 0, size = 10 }: ConsultaFila = {}): Promise<PaginaFila> {
    const params = new URLSearchParams();
    if (busca.trim()) params.set('busca', busca.trim());
    if (status) params.set('status', status);
    params.set('page', String(page));
    params.set('size', String(size));

    const resposta = await fetch(`${BASE_URL}/setor-guias/pre-guias?${params}`, { headers: cabecalhos() });
    if (!resposta.ok) {
      throw new Error('Não foi possível carregar a fila de pré-guias.');
    }
    return resposta.json();
  },
};
