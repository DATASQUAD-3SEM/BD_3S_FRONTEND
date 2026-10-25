import { ApiError } from '../../shared/api/http';
import type { DetalhePreGuia, GuiaRascunhoDetalhe, PreGuiaSetorApi } from './types';

interface OpcoesMock {
  /** Atraso simulado em ms. Nos testes use 0. */
  atrasoMs?: number;
}

const LIMITE_OBSERVACAO = 500;

/** Pré-guias de exemplo. A 0411 é a da arte: origem MÉDICO, sem anexo, em análise. */
function sementes(): DetalhePreGuia[] {
  return [
    {
      id: 11,
      numero: '0411',
      status: 'EM_ANALISE',
      origem: 'MEDICO',
      beneficiario: { nome: 'Marta Souza Lima', precCp: '45810020001', faixaEtaria: '41 a 50' },
      ocsNome: 'Laboratório Exemplo',
      procedimentos: [
        { codigoTuss: '40304361', nome: 'Hemograma completo' },
        { codigoTuss: '40301630', nome: 'Glicose' },
      ],
      medicoCriador: { patente: 'Cap Méd', nome: 'Ribeiro', crm: '000.000-SP' },
      encaminhamento: null,
      guiaRascunho: null,
      guiaConcluida: false,
    },
    {
      id: 12,
      numero: '0412',
      status: 'PENDENTE',
      origem: 'BENEFICIARIO',
      beneficiario: { nome: 'Antonio Carlos Ferreira', precCp: '45872213300', faixaEtaria: '51 a 60' },
      ocsNome: 'Hospital Exemplo',
      procedimentos: [{ codigoTuss: '40304361', nome: 'Hemograma completo' }],
      medicoCriador: null,
      encaminhamento: { nome: 'encaminhamento-0412.pdf', tipo: 'application/pdf', tamanhoBytes: 2048 },
      guiaRascunho: null,
      guiaConcluida: false,
    },
    {
      id: 9,
      numero: '0409',
      status: 'ATENCAO',
      origem: 'BENEFICIARIO',
      beneficiario: { nome: 'Antonio Carlos Ferreira', precCp: '45872213300', faixaEtaria: '51 a 60' },
      ocsNome: 'Laboratório Exemplo',
      procedimentos: [{ codigoTuss: '40301630', nome: 'Glicose' }],
      medicoCriador: null,
      encaminhamento: { nome: 'foto-0409.jpg', tipo: 'image/jpeg', tamanhoBytes: 4096 },
      guiaRascunho: null,
      guiaConcluida: false,
    },
    {
      id: 1,
      numero: '0401',
      status: 'CONCLUIDA',
      origem: 'BENEFICIARIO',
      beneficiario: { nome: 'Antonio Carlos Ferreira', precCp: '45872213300', faixaEtaria: '51 a 60' },
      ocsNome: 'Hospital Exemplo',
      procedimentos: [{ codigoTuss: '40301630', nome: 'Glicose' }],
      medicoCriador: null,
      encaminhamento: { nome: 'encaminhamento-0401.pdf', tipo: 'application/pdf', tamanhoBytes: 1024 },
      guiaRascunho: { numero: '202610401', nomeArquivo: 'Guia_202610401.pdf' },
      guiaConcluida: true,
    },
  ];
}

/** Implementa o mesmo contrato do cliente real, com estado em memória (para testes e demonstração). */
export function criarMockPreGuiaSetor({ atrasoMs = 200 }: OpcoesMock = {}): PreGuiaSetorApi {
  const registros = new Map(sementes().map((d) => [d.id, d]));
  const espera = () => (atrasoMs > 0 ? new Promise<void>((resolve) => setTimeout(resolve, atrasoMs)) : Promise.resolve());

  const obter = (id: number): DetalhePreGuia => {
    const detalhe = registros.get(id);
    if (!detalhe) throw new ApiError(404, 'Pré-guia não encontrada');
    return detalhe;
  };

  return {
    async detalhar(id) {
      await espera();
      return JSON.parse(JSON.stringify(obter(id))) as DetalhePreGuia;
    },

    async abrir(id) {
      await espera();
      const detalhe = obter(id);
      if (detalhe.status === 'PENDENTE') detalhe.status = 'EM_ANALISE';
      return { status: detalhe.status };
    },

    async requererCorrecao(id, observacao) {
      await espera();
      const detalhe = obter(id);
      const texto = observacao.trim();
      if (texto === '') throw new ApiError(422, 'Dados invalidos', ['observacao: Campo obrigatório']);
      if (texto.length > LIMITE_OBSERVACAO) {
        throw new ApiError(422, 'Dados invalidos', [`observacao: Máximo de ${LIMITE_OBSERVACAO} caracteres`]);
      }
      if (detalhe.status !== 'EM_ANALISE') throw new ApiError(409, 'Pré-guia não está em análise');
      detalhe.status = 'ATENCAO';
      return { status: detalhe.status, dataDecisao: new Date().toISOString() };
    },

    async anexarGuia(id, numeroGuia, pdf) {
      await espera();
      const detalhe = obter(id);
      if (!/^\d+$/.test(numeroGuia)) {
        throw new ApiError(422, 'Dados invalidos', ['numeroGuia: Informe um número com apenas dígitos']);
      }
      if (pdf.type !== 'application/pdf') throw new ApiError(422, 'Dados invalidos', ['pdf: Envie um arquivo PDF']);
      if (detalhe.status !== 'EM_ANALISE' || detalhe.guiaConcluida) {
        throw new ApiError(409, 'Pré-guia não permite anexar a Guia');
      }
      const rascunho: GuiaRascunhoDetalhe = { numero: numeroGuia, nomeArquivo: pdf.name };
      detalhe.guiaRascunho = rascunho;
      return { ...rascunho };
    },

    async concluirGuia(id) {
      await espera();
      const detalhe = obter(id);
      if (detalhe.guiaConcluida) throw new ApiError(409, 'Esta pré-guia já tem uma Guia');
      if (!detalhe.guiaRascunho) throw new ApiError(409, 'Guia não anexada');
      if (detalhe.status !== 'EM_ANALISE') throw new ApiError(409, 'Pré-guia não está em análise');
      detalhe.guiaConcluida = true;
      return {
        guiaId: id * 10,
        numero: detalhe.guiaRascunho.numero,
        validadeAte: '2026-12-24',
        assinaturasPendentes: ['MEDICO', 'CHEFE'],
      };
    },

    async buscarEncaminhamento(id) {
      await espera();
      const detalhe = obter(id);
      if (!detalhe.encaminhamento) throw new ApiError(404, 'Encaminhamento não encontrado');
      return new Blob(['mock'], { type: detalhe.encaminhamento.tipo });
    },
  };
}

export const preGuiaSetorMockApi: PreGuiaSetorApi = criarMockPreGuiaSetor();
