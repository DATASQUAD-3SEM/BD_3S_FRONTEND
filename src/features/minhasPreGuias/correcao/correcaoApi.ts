// Cliente HTTP real da correção pelo beneficiário (T9-FE). Contratos: T9-BE1 a T9-BE4.
import { get, getBlob, postForm } from '../../../shared/api/http';
import type { CorrecaoApi, CorrecaoPreGuia, OcsBuscaResposta, RespostaReenvio } from './types';

const base = (id: number) => `/beneficiarios/me/pre-guias/${id}`;

export const correcaoApi: CorrecaoApi = {
  obterCorrecao: (id) => get<CorrecaoPreGuia>(`${base(id)}/correcao`),

  buscarEncaminhamento: (id) => getBlob(`${base(id)}/encaminhamento/arquivo`),

  buscarOcs: async (busca) => {
    const termo = busca.trim();
    const query = termo ? `?busca=${encodeURIComponent(termo)}` : '';
    const resposta = await get<OcsBuscaResposta>(`/ocs${query}`);
    return resposta.resultados;
  },

  reenviar: (id, dados) => {
    const formulario = new FormData();
    if (dados.ocsId !== undefined) formulario.append('ocsId', String(dados.ocsId));
    if (dados.arquivo) formulario.append('arquivo', dados.arquivo);
    return postForm<RespostaReenvio>(`${base(id)}/reenvio`, formulario);
  },
};
