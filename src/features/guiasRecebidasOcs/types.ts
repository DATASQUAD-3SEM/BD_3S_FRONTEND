import type { SituacaoGuia } from '../minhasGuias/types';

/** Contrato T19-BE1: GET /ocs/guias. So as guias enviadas a OCS logada (sem Nao enviada nem Vencida). */

export interface ProcedimentoRecebido {
  codDgp: string;
  descricao: string;
  quantidade: number;
}

export interface GuiaRecebida {
  id: number;
  numero: string;
  beneficiario: { nome: string; precCp: string };
  procedimentos: ProcedimentoRecebido[];
  /** Data de envio em ISO (aaaa-mm-ddThh:mm:ss). */
  dataEnvio: string;
  situacao: SituacaoGuia;
}
