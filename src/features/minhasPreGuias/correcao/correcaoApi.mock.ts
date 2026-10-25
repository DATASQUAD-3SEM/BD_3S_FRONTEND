import { ApiError } from '../../../shared/api/http';
import type { CorrecaoApi, CorrecaoPreGuia, OcsBusca } from './types';

const espera = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const normalizar = (texto: string) =>
  texto.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Pré-guia 0003: criada pelo próprio beneficiário e em Atenção (a única que abre a tela de correção).
export const correcaoMock: CorrecaoPreGuia = {
  numero: '0003',
  status: 'ATENCAO',
  beneficiario: { nome: 'João da Silva', precCp: '2841773' },
  dataCriacao: '2026-10-07T14:10:00',
  observacao: {
    texto:
      'A foto do encaminhamento está desfocada e não dá para ler o nome do médico. Envie outra foto com boa iluminação.',
    dataRegistro: '2026-10-07T16:20:00',
  },
  encaminhamentoAtual: { nome: 'encaminhamento-0003.jpg', tipo: 'image/jpeg', dataEnvio: '2026-10-07T14:10:00' },
  ocsAtual: { id: 1, nome: 'Policlínica Militar' },
};

export const ocsMock: OcsBusca[] = [
  { id: 1, nome: 'Policlínica Militar', contrato: 'CT-2024-001', tipo: 'OCS' },
  { id: 2, nome: 'Clínica Santa Maria', contrato: 'CT-2024-014', tipo: 'PSA' },
  { id: 3, nome: 'Laboratório Vida', contrato: 'CT-2023-208', tipo: 'OCS' },
  { id: 4, nome: 'Hospital Central do Exército', contrato: 'CT-2022-005', tipo: 'OCS' },
];

// Mock dos contratos T9-BE1 a T9-BE4. Ids para testar cada resposta:
// 3 = correção válida; 5 = criada por médico (403); 1, 2 e 4 = fora de Atenção (409); demais = 404.
export const correcaoApiMock: CorrecaoApi = {
  async obterCorrecao(id) {
    await espera(300);
    if (id === 3) return correcaoMock;
    if (id === 5) throw new ApiError(403, 'Esta pré-guia foi criada pelo seu médico. Só ele pode corrigi-la.');
    if ([1, 2, 4].includes(id)) throw new ApiError(409, 'Esta pré-guia não está em Atenção.');
    throw new ApiError(404, 'Pré-guia não encontrada.');
  },

  async buscarEncaminhamento() {
    await espera(200);
    return new Blob(['mock'], { type: 'image/jpeg' });
  },

  async buscarOcs(busca) {
    await espera(150);
    const termo = normalizar(busca.trim());
    return ocsMock
      .filter((o) => !termo || [o.nome, o.contrato, o.tipo].some((campo) => normalizar(campo).includes(termo)))
      .slice(0, 30);
  },

  async reenviar(_id, dados) {
    await espera(400);
    if (dados.ocsId === undefined && !dados.arquivo) {
      throw new ApiError(422, 'Informe uma OCS ou um novo encaminhamento.');
    }
    return { status: 'PENDENTE', dataReenvio: new Date().toISOString() };
  },
};
