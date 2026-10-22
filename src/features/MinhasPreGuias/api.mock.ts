import type { MinhasPreGuiasApi, PreGuiaDoBeneficiario } from './types';

const espera = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Dados fixos usados nos testes — cobrem todos os status e as duas origens.
export const preGuiasMock: PreGuiaDoBeneficiario[] = [
  {
    id: 4,
    numero: '0004',
    ocsNome: 'Hospital Central do Exército',
    origem: 'MEDICO',
    criadoPorMedico: { nome: 'Ribeiro', patente: 'Cap Méd' },
    dataCriacao: '2026-10-09T09:30:00',
    status: 'CONCLUIDA',
    guia: { numero: '123456', validadeAte: '2026-12-08' },
  },
  {
    id: 5,
    numero: '0005',
    ocsNome: 'Laboratório Vida',
    origem: 'MEDICO',
    criadoPorMedico: { nome: 'Ribeiro', patente: 'Cap Méd' },
    dataCriacao: '2026-10-08T10:00:00',
    status: 'ATENCAO',
    observacao: 'Hemograma completo informado em duplicidade. Favor revisar a lista de exames.',
  },
  {
    id: 3,
    numero: '0003',
    ocsNome: 'Policlínica Militar',
    origem: 'BENEFICIARIO',
    dataCriacao: '2026-10-07T14:10:00',
    status: 'ATENCAO',
    observacao:
      'A foto do encaminhamento está desfocada e não dá para ler o nome do médico. Envie outra foto com boa iluminação.',
  },
  {
    id: 2,
    numero: '0002',
    ocsNome: 'Clínica Santa Maria',
    origem: 'BENEFICIARIO',
    dataCriacao: '2026-10-05T11:00:00',
    status: 'EM_ANALISE',
  },
  {
    id: 1,
    numero: '0001',
    ocsNome: 'Laboratório Vida',
    origem: 'BENEFICIARIO',
    dataCriacao: '2026-10-03T08:45:00',
    status: 'PENDENTE',
  },
];

// Mock completo da API — implementa o contrato de MinhasPreGuiasApi.
export const apiMock: MinhasPreGuiasApi = {
  async listar() {
    await espera(300);
    return preGuiasMock;
  },
 async obterPdf() {
   await espera(200);
   return new Blob(['%PDF-1.4 mock'], { type: 'application/pdf' });
 },
};
