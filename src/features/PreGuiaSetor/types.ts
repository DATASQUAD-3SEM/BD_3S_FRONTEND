import type { OrigemPreGuia, StatusPreGuia } from '../filaPreGuias/types';

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

export interface PreGuiaSetorApi {
  detalhar(id: number): Promise<DetalhePreGuia>;
  abrir(id: number): Promise<AberturaResposta>;
  requererCorrecao(id: number, observacao: string): Promise<CorrecaoResposta>;
  anexarGuia(id: number, numeroGuia: string, pdf: File): Promise<GuiaRascunhoResposta>;
  concluirGuia(id: number): Promise<GuiaConcluidaResposta>;
  buscarEncaminhamento(id: number): Promise<Blob>;
}
