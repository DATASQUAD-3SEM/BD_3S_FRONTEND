// Cliente HTTP real da tela de detalhe do setor (T4-FE). Contratos: T4-BE1 a T4-BE6, T22-BE1, T16-BE1 e T16-BE2.
import { get, getBlob, post, postForm, putForm } from '../../shared/api/http';
import type {
  AberturaResposta,
  CorrecaoResposta,
  DetalhePreGuia,
  ExtracaoNumeroGuia,
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

  extrairNumeroGuia: (pdf, preGuiaId) => {
    const formulario = new FormData();
    formulario.append('pdf', pdf);
    // T21-BE1: sem preGuiaId, o servidor nao compara o Prec CP (precCpConfere vem null).
    if (preGuiaId !== undefined) formulario.append('preGuiaId', String(preGuiaId));
    return postForm<ExtracaoNumeroGuia>('/setor-guias/extrair-numero-guia', formulario);
  },

  anexarGuia: (id, numeroGuia, pdf, exames, { ug, ugOrigem, validadeAte }) => {
    const formulario = new FormData();
    formulario.append('numeroGuia', numeroGuia);
    formulario.append('pdf', pdf);
    formulario.append('exames', JSON.stringify(exames));
    // T16-BE2: o servidor confere ug e ugOrigem e nao as grava; so a validade e gravada
    formulario.append('ug', ug);
    formulario.append('ugOrigem', ugOrigem);
    formulario.append('validadeAte', validadeAte);
    return putForm<GuiaRascunhoResposta>(`${base(id)}/guia-rascunho`, formulario);
  },

  concluirGuia: (id) => post<GuiaConcluidaResposta>(`${base(id)}/guia/concluir`, undefined),

  buscarEncaminhamento: (id) => getBlob(`${base(id)}/encaminhamento`),
};
