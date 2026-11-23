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

/** Situacao de uma sessao (T18/T19): so o que a grade mostra. */
export type SituacaoSessaoOcs = 'DISPONIVEL' | 'SOLICITADA' | 'ASSINADA' | 'EXPIRADA';

export interface SessaoRecebida {
  id: number;
  /** Cod DGP do procedimento a que a sessao pertence. */
  procedimento: string;
  numero: number;
  status: SituacaoSessaoOcs;
  dataSolicitacao: string | null;
  dataAssinatura: string | null;
}

/** Contrato T19-BE2: GET /ocs/guias/{id}. Sem CPF nem dados da assinatura do beneficiario. */
export interface GuiaRecebidaDetalhe {
  id: number;
  numero: string;
  /** Data limite lida do PDF ("NAO RECEBER APOS"), AAAA-MM-DD. */
  validadeAte: string;
  beneficiario: { nome: string; precCp: string };
  procedimentos: ProcedimentoRecebido[];
  sessoes: SessaoRecebida[];
}
