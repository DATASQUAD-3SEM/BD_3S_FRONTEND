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

/** Exame da Guia conferido pelo Setor de Guias (T22-BE1). */
export interface ExameGuia {
  codDgp: string;
  descricao: string;
  quantidade: number;
}

export interface GuiaRascunhoDetalhe {
  numero: string;
  nomeArquivo: string;
  /** Na ordem gravada; vazia quando o rascunho e anterior aos exames (T22-BE1). */
  exames: ExameGuia[];
  /**
   * Validade (yyyy-mm-dd) gravada no rascunho (T16-BE2). Ausente ou nula em rascunho anterior a ela; a UG e a
   * UG Origem nao sao gravadas, entao nao voltam aqui.
   */
  validadeAte?: string | null;
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

/**
 * Contrato T11-BE1, estendido pela T21-BE1 e T16-BE1: POST /setor-guias/extrair-numero-guia. Nao grava nada.
 * `ug`, `ugOrigem` e `validadeAte` (yyyy-mm-dd) vem nulos quando o PDF nao os traz (nao e erro).
 */
export interface ExtracaoNumeroGuia {
  numeroGuia: string;
  exames?: ExameGuia[];
  ug?: string | null;
  ugOrigem?: string | null;
  validadeAte?: string | null;
}

/** O que a tela guarda depois de ler o PDF (ou de uma leitura que falhou: tudo vazio). */
export interface LeituraDaGuia {
  numero: string;
  exames: ExameGuia[];
  ug: string;
  /** UG Origem lida do PDF: nao tem campo na tela e nao e editavel. Nula se nao foi lida. */
  ugOrigem: string | null;
  /** yyyy-mm-dd; nula se nao foi lida. */
  validadeAte: string | null;
}

/**
 * Conferencia enviada no PUT do rascunho (T16-BE2). `ug` e `ugOrigem` servem so para o servidor conferir
 * e nao sao gravados; `validadeAte` (yyyy-mm-dd) e gravada.
 */
export interface ConferenciaGuia {
  ug: string;
  ugOrigem: string;
  validadeAte: string;
}

export interface PreGuiaSetorApi {
  detalhar(id: number): Promise<DetalhePreGuia>;
  abrir(id: number): Promise<AberturaResposta>;
  requererCorrecao(id: number, observacao: string): Promise<CorrecaoResposta>;
  extrairNumeroGuia(pdf: File): Promise<ExtracaoNumeroGuia>;
  anexarGuia(
    id: number,
    numeroGuia: string,
    pdf: File,
    exames: ExameGuia[],
    conferencia: ConferenciaGuia,
  ): Promise<GuiaRascunhoResposta>;
  concluirGuia(id: number): Promise<GuiaConcluidaResposta>;
  buscarEncaminhamento(id: number): Promise<Blob>;
}
