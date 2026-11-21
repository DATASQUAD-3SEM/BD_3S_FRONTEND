import type { FaturaLisuraDetalhe } from '../rastreabilidade/types'
/** Fatura em auditoria na lista (AuditoriaResumoResponse, T26-BE1). Só consulta nesta tela. */
export interface FaturaAuditoriaResumo {
  id: number;
  ocs: string;
  numeroFatura: string | null;
  dataEntrada: string;
  dataInicio: string;
  dataEnvio: string;
  /** Data do envio à auditoria (evento ENVIADA_AUDITORIA): ordena a lista. */
  dataRecebimentoAuditoria: string | null;
  situacao: 'EM_AUDITORIA';
  valorInformado: number;
  valorGlosa: number | null;
  valorFinal: number | null;
}

/** Cliente HTTP da tela de Faturas Recebidas da auditoria (T26-FE1). */
export interface AuditoriaApi {
  listarFaturas(): Promise<FaturaAuditoriaResumo[]>;
  /** Detalhe da fatura em auditoria (só leitura, T26-FE2). */
  detalhar(id: number): Promise<FaturaLisuraDetalhe>;
  /** PDF da Guia para a auditoria (só consulta). */
  obterPdfGuia(guiaId: number): Promise<Blob>;
}
