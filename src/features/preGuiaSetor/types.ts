import type { OrigemPreGuia, StatusPreGuia } from '../filaPreGuias/types';

/**
 * Tipos do contrato do detalhe da pre-guia do Setor de Guias (T4-BE1 a T4-BE6).
 */

export interface BeneficiarioDetalhe {
  nome: string;
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
  /** Tipo MIME, ex.: "application/pdf" ou "image/png". */
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

/** Contrato T4-BE3: POST /setor-guias/pre-guias/{id}/abertura */
export interface AberturaResposta {
  status: StatusPreGuia;
}

/** Contrato T4-BE4: POST /setor-guias/pre-guias/{id}/correcao */
export interface CorrecaoResposta {
  status: StatusPreGuia;
  dataDecisao: string;
}

/** Contrato T4-BE5: PUT /setor-guias/pre-guias/{id}/guia-rascunho */
export interface GuiaRascunhoResposta {
  numero: string;
  nomeArquivo: string;
}

/** Contrato T4-BE6: POST /setor-guias/pre-guias/{id}/guia/concluir */
export interface GuiaConcluidaResposta {
  guiaId: number;
  numero: string;
  validadeAte: string;
  assinaturasPendentes: string[];
}

/**
 * Contrato T11-BE1: POST /setor-guias/extrair-numero-guia. Nao grava nada.
 * `exames` so vem quando a leitura dos exames existir (T21); hoje a resposta traz so o numero.
 */
export interface ExtracaoNumeroGuia {
  numeroGuia: string;
  exames?: ExameGuia[];
}

export interface PreGuiaSetorApi {
  detalhar(id: number): Promise<DetalhePreGuia>;
  abrir(id: number): Promise<AberturaResposta>;
  requererCorrecao(id: number, observacao: string): Promise<CorrecaoResposta>;
  extrairNumeroGuia(pdf: File): Promise<ExtracaoNumeroGuia>;
  anexarGuia(id: number, numeroGuia: string, pdf: File, exames: ExameGuia[]): Promise<GuiaRascunhoResposta>;
  concluirGuia(id: number): Promise<GuiaConcluidaResposta>;
  buscarEncaminhamento(id: number): Promise<Blob>;
}
