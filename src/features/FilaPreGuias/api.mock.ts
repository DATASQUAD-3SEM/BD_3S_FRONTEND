

import type { ConsultaFila, FilaPreGuiasApi, ItemFila, PaginaFila, StatusPreGuia, OrigemPreGuia } from './types';

type ItemMock = ItemFila & { precCp: string };

export const filaMock: ItemMock[] = [
  { id: 12, numero: '0412', beneficiarioNome: 'Antonio Carlos Ferreira', precCp: '458722133-00', ocsNome: 'Hospital Exemplo', origem: 'BENEFICIARIO' as OrigemPreGuia, dataCriacao: '2026-10-12T09:30:00', status: 'PENDENTE' as StatusPreGuia },
  { id: 11, numero: '0411', beneficiarioNome: 'Marta Souza Lima', precCp: '458100200-01', ocsNome: 'Laboratório Exemplo', origem: 'MEDICO' as OrigemPreGuia, dataCriacao: '2026-10-11T14:10:00', status: 'EM_ANALISE' as StatusPreGuia },
  { id: 9, numero: '0409', beneficiarioNome: 'Antonio Carlos Ferreira', precCp: '458722133-00', ocsNome: 'Laboratório Exemplo', origem: 'BENEFICIARIO' as OrigemPreGuia, dataCriacao: '2026-10-10T11:00:00', status: 'ATENCAO' as StatusPreGuia },
  { id: 8, numero: '0408', beneficiarioNome: 'João Pereira Alves', precCp: '458300400-02', ocsNome: 'Hospital Exemplo', origem: 'BENEFICIARIO' as OrigemPreGuia, dataCriacao: '2026-10-09T08:45:00', status: 'PENDENTE' as StatusPreGuia },
  { id: 7, numero: '0407', beneficiarioNome: 'Antonio Carlos Ferreira', precCp: '458722133-00', ocsNome: 'Laboratório Exemplo', origem: 'MEDICO' as OrigemPreGuia, dataCriacao: '2026-10-08T10:00:00', status: 'ATENCAO' as StatusPreGuia },
  { id: 1, numero: '0401', beneficiarioNome: 'Antonio Carlos Ferreira', precCp: '458722133-00', ocsNome: 'Hospital Exemplo', origem: 'BENEFICIARIO' as OrigemPreGuia, dataCriacao: '2026-10-02T16:20:00', status: 'CONCLUIDA' as StatusPreGuia },
];

const semAcento = (t: string) => t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim();
const digitos = (t: string) => t.replace(/\D/g, '');
const espera = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const filaPreGuiasMockApi: FilaPreGuiasApi = {
  async listar({ busca = '', status = '', page = 0, size = 10 }: ConsultaFila = {}): Promise<PaginaFila> {
    await espera(250);
    const termo = semAcento(busca);
    const termoDigitos = digitos(busca);
    const filtrados = filaMock
      .filter((p) => !status || p.status === status)
      .filter(
        (p) =>
          !termo ||
          semAcento(p.beneficiarioNome).includes(termo) ||
          semAcento(p.precCp).includes(termo) ||
          (termoDigitos && digitos(p.precCp).includes(termoDigitos)),
      )
      .sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao));
    const itens = filtrados
      .slice(page * size, page * size + size)
      .map((item): ItemFila => {
        const { precCp, ...resto } = item;
        void precCp; // ItemFila não expõe precCp; descartamos explicitamente
        return resto;
      });
    return { total: filtrados.length, pagina: page, tamanho: size, itens };
  },
};
