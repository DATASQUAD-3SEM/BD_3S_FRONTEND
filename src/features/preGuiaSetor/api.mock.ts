import { ApiError } from '../../shared/api/http';
import { formatarData } from '../../shared/utils/formatadores';
import { hojeIso, UG_FUSEX, ugEhDoFusex } from './conferenciaGuia';
import type {
  DetalhePreGuia,
  ExameGuia,
  ExtracaoNumeroGuia,
  GuiaRascunhoDetalhe,
  PreGuiaSetorApi,
} from './types';

/**
 * Implementacao em memoria do contrato T4-BE1 a T4-BE6 (detalhe, abertura, correcao, anexo e conclusao da Guia)
 * e da leitura do numero da Guia (T11-BE1), com os exames de exemplo (T22-FE1) e a conferencia de UG,
 * UG Origem e validade (T16-FE).
 *
 * Leitura: por padrao devolve 202610678, dois exames, UG e UG Origem do FUSEX e validade daqui a um ano.
 * Para ver os outros retornos, use o nome do arquivo:
 * "sem-numero" (422), "invalido" (400), "limite" (429), "falha" (500) e "sem-exames" (numero lido, nenhum exame);
 * "guia-ok" (UG e UG Origem do FUSEX, validade 01/01/2027), "guia-ug-origem-outra" (UG do FUSEX, UG Origem
 * Cmdo Bda Inf Sul), "guia-outra-ug" (UG Cmdo Bda Inf Sul), "guia-sem-validade" (validade nao lida) e
 * "guia-202610678-exemplo" (PDF de exemplo: validade 20/10/2026, ja vencida).
 */

const EXAMES_EXEMPLO: ExameGuia[] = [
  { codDgp: '41001109', descricao: 'TC - Abdome superior', quantidade: 1 },
  { codDgp: '41001110', descricao: 'Ultrassonografia de abdome total', quantidade: 2 },
];

const UG_OUTRA = 'Cmdo Bda Inf Sul';

type LeituraConferencia = Pick<ExtracaoNumeroGuia, 'ug' | 'ugOrigem' | 'validadeAte'>;

/** Hoje + 1 ano (yyyy-mm-dd): validade futura para o caminho feliz, que nao vence com o passar do tempo. */
function validadeFutura(): string {
  const data = new Date();
  data.setFullYear(data.getFullYear() + 1);
  return hojeIso(data);
}

/** UG, UG Origem e validade que a leitura devolve, conforme o nome do PDF. */
function conferenciaDoNome(nome: string): LeituraConferencia {
  if (nome.includes('guia-ug-origem-outra')) return { ug: UG_FUSEX, ugOrigem: UG_OUTRA, validadeAte: '2027-01-01' };
  if (nome.includes('guia-outra-ug')) return { ug: UG_OUTRA, ugOrigem: UG_FUSEX, validadeAte: '2027-01-01' };
  if (nome.includes('guia-sem-validade')) return { ug: UG_FUSEX, ugOrigem: UG_FUSEX, validadeAte: null };
  if (nome.includes('guia-202610678-exemplo')) return { ug: UG_FUSEX, ugOrigem: UG_FUSEX, validadeAte: '2026-10-20' };
  if (nome.includes('guia-ok')) return { ug: UG_FUSEX, ugOrigem: UG_FUSEX, validadeAte: '2027-01-01' };
  return { ug: UG_FUSEX, ugOrigem: UG_FUSEX, validadeAte: validadeFutura() };
}

interface OpcoesMock {
  atrasoMs?: number;
}

const LIMITE_OBSERVACAO = 500;

function sementes(): DetalhePreGuia[] {
  return [
    {
      id: 11,
      numero: '0411',
      status: 'EM_ANALISE',
      origem: 'MEDICO',
      beneficiario: { nome: 'Marta Souza Lima', cpf: '52998224725', precCp: '45810020001', faixaEtaria: '41 a 50' },
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
      beneficiario: { nome: 'Antonio Carlos Ferreira', cpf: '11144477735', precCp: '45872213300', faixaEtaria: '51 a 60' },
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
      beneficiario: { nome: 'Antonio Carlos Ferreira', cpf: '11144477735', precCp: '45872213300', faixaEtaria: '51 a 60' },
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
      beneficiario: { nome: 'Antonio Carlos Ferreira', cpf: '11144477735', precCp: '45872213300', faixaEtaria: '51 a 60' },
      ocsNome: 'Hospital Exemplo',
      procedimentos: [{ codigoTuss: '40301630', nome: 'Glicose' }],
      medicoCriador: null,
      encaminhamento: { nome: 'encaminhamento-0401.pdf', tipo: 'application/pdf', tamanhoBytes: 1024 },
      guiaRascunho: {
        numero: '202610401',
        nomeArquivo: 'Guia_202610401.pdf',
        exames: [{ codDgp: '41001109', descricao: 'TC - Abdome superior', quantidade: 1 }],
      },
      guiaConcluida: true,
    },
  ];
}

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
      if (texto.length > LIMITE_OBSERVACAO) throw new ApiError(422, 'Dados invalidos', [`observacao: Máximo de ${LIMITE_OBSERVACAO} caracteres`]);
      if (detalhe.status !== 'EM_ANALISE') throw new ApiError(409, 'Pré-guia não está em análise');
      detalhe.status = 'ATENCAO';
      return { status: detalhe.status, dataDecisao: new Date().toISOString() };
    },
    async extrairNumeroGuia(pdf) {
      await espera();
      const nome = pdf.name.toLowerCase();
      if (nome.includes('sem-numero')) throw new ApiError(422, 'Número não encontrado');
      if (nome.includes('invalido')) throw new ApiError(400, 'Arquivo inválido');
      if (nome.includes('limite')) throw new ApiError(429, 'Excesso de requisições');
      if (nome.includes('falha')) throw new ApiError(500, 'Falha inesperada');
      const conferencia = conferenciaDoNome(nome);
      if (nome.includes('sem-exames')) return { numeroGuia: '202610678', exames: [], ...conferencia };
      return { numeroGuia: '202610678', exames: EXAMES_EXEMPLO.map((e) => ({ ...e })), ...conferencia };
    },

    // Confere como o servidor (T16-BE2): UG, UG Origem e validade valem 422 e nada e gravado. So a validade e gravada.
    async anexarGuia(id, numeroGuia, pdf, exames, { ug, ugOrigem, validadeAte }) {
      await espera();
      const detalhe = obter(id);
      if (!/^\d+$/.test(numeroGuia)) throw new ApiError(422, 'Dados invalidos', ['numeroGuia: Informe um número com apenas dígitos']);
      if (pdf.type !== 'application/pdf') throw new ApiError(422, 'Dados invalidos', ['pdf: Envie um arquivo PDF']);
      if (exames.length === 0) {
        throw new ApiError(422, 'Dados invalidos', ['exames: Informe ao menos um exame da Guia']);
      }
      if (!ugEhDoFusex(ug)) {
        throw new ApiError(422, 'Dados invalidos', [`ug: A Guia não é do FUSEX. A UG deve ser ${UG_FUSEX}.`]);
      }
      if (!ugEhDoFusex(ugOrigem)) {
        throw new ApiError(422, 'Dados invalidos', [
          `ugOrigem: A UG Origem impressa na Guia é diferente de ${UG_FUSEX}. Esta Guia não é do FUSEX.`,
        ]);
      }
      if (validadeAte === '') throw new ApiError(422, 'Dados invalidos', ['validadeAte: Informe a validade da Guia']);
      if (validadeAte < hojeIso()) {
        throw new ApiError(422, 'Dados invalidos', [
          `validadeAte: Esta Guia já venceu em ${formatarData(validadeAte)}. Não é possível concluir.`,
        ]);
      }
      if (detalhe.status !== 'EM_ANALISE' || detalhe.guiaConcluida) {
        throw new ApiError(409, 'Pré-guia não permite anexar a Guia');
      }
      const rascunho: GuiaRascunhoDetalhe = { numero: numeroGuia, nomeArquivo: pdf.name, exames, validadeAte };
      detalhe.guiaRascunho = rascunho;
      return { ...rascunho };
    },
    async concluirGuia(id) {
      await espera();
      const detalhe = obter(id);
      if (detalhe.guiaConcluida) throw new ApiError(409, 'Esta pré-guia já tem uma Guia');
      if (!detalhe.guiaRascunho) throw new ApiError(409, 'Guia não anexada');
      if (!detalhe.guiaRascunho.validadeAte) throw new ApiError(409, 'Guia sem validade conferida');
      if (detalhe.status !== 'EM_ANALISE') throw new ApiError(409, 'Pré-guia não está em análise');
      detalhe.guiaConcluida = true;
      return {
        guiaId: id * 10,
        numero: detalhe.guiaRascunho.numero,
        validadeAte: detalhe.guiaRascunho.validadeAte,
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
