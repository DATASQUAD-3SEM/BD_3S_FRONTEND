// Cliente HTTP real da tela de detalhe do setor (T4-FE). Contratos: T4-BE1 a T4-BE6.
import { get, getBlob, post, putForm } from '../../shared/api/http';
import type {
  AberturaResposta,
  CorrecaoResposta,
  DetalhePreGuia,
  GuiaConcluidaResposta,
  GuiaRascunhoResposta,
  PreGuiaSetorApi,
} from './types';

const base = (id: number) => `/setor-guias/pre-guias/${id}`;

export const preGuiaSetorApi: PreGuiaSetorApi = {
  detalhar: (id) => get<DetalhePreGuia>(base(id)),

  abrir: (id) => post<AberturaResposta>(`${base(id)}/abertura`, undefined),

  requererCorrecao: (id, observacao) =>
    post<CorrecaoResposta>(`${base(id)}/correcao`, { observacao }),

  anexarGuia: (id, numeroGuia, pdf) => {
    const formulario = new FormData();
    formulario.append('numeroGuia', numeroGuia);
    formulario.append('pdf', pdf);
    return putForm<GuiaRascunhoResposta>(`${base(id)}/guia-rascunho`, formulario);
  },

  concluirGuia: (id) => post<GuiaConcluidaResposta>(`${base(id)}/guia/concluir`, undefined),

  buscarEncaminhamento: (id) => getBlob(`${base(id)}/encaminhamento`),
};
