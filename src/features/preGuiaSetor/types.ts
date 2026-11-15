import type { OrigemPreGuia, StatusPreGuia } from '../filaPreGuias/types';

/**
 * Tipos do contrato do detalhe da pre-guia do Setor de Guias (T4-BE1 a T4-BE6).
 */

export interface BeneficiarioDetalhe {
  nome: string;
  cpf?: string | null; // T17-FE: CPF do beneficiário
  precCp: string;
  faixaEtaria: string;
}

export interface ProcedimentoDetalhe {
  codigoTuss: string;
  nome: string;
}

export interface MedicoCriador {
  patente: string;
  nome: string;
  crm: string;
}

export interface EncaminhamentoDetalhe {
  nome: string;
  tipo: string;
  tamanhoBytes: number;
}

export interface GuiaRascunhoDetalhe {
  numero: string;
  nomeArquivo: string;
}

/** Contrato T4-BE1: GET /setor-guias/pre-guias/{id} */
export interface DetalhePreGuia {
  id: number;
  numero: string;
  status: StatusPreGuia;
  origem: OrigemPreGuia;
  beneficiario: BeneficiarioDetalhe;
  ocsNome: string;
  procedimentos: ProcedimentoDetalhe[];
  medicoCriador: MedicoCriador | null;
  encaminhamento: EncaminhamentoDetalhe | null;
  guiaRascunho: GuiaRascunhoDetalhe | null;
  guiaConcluida: boolean;
}

export interface AberturaResposta {
  status: StatusPreGuia;
}

export interface CorrecaoResposta {
  status: StatusPreGuia;
  dataDecisao: string;
}

export interface GuiaRascunhoResposta {
  numero: string;
  nomeArquivo: string;
}

export interface GuiaConcluidaResposta {
  guiaId: number;
  numero: string;
  validadeAte: string;
  assinaturasPendentes: string[];
}

export interface ExtracaoNumeroGuia {
  numeroGuia: string;
}

export interface PreGuiaSetorApi {
  detalhar(id: number): Promise<DetalhePreGuia>;
  abrir(id: number): Promise<AberturaResposta>;
  requererCorrecao(id: number, observacao: string): Promise<CorrecaoResposta>;
  extrairNumeroGuia(pdf: File): Promise<ExtracaoNumeroGuia>;
  anexarGuia(id: number, numeroGuia: string, pdf: File): Promise<GuiaRascunhoResposta>;
  concluirGuia(id: number): Promise<GuiaConcluidaResposta>;
  buscarEncaminhamento(id: number): Promise<Blob>;
}
