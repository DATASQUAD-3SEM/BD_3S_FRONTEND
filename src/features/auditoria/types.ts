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

/** Item do andamento da glosa de uma Guia (T26-BE4): data e texto fixo. */
export interface ItemAndamentoGlosa {
  data: string;
  texto: string;
}

/** Andamento da glosa por Guia que foi à OCS em alguma rodada (T26-BE4, regra 13.2). */
export interface AndamentoGlosa {
  guiaId: number;
  guiaNumero: string;
  situacaoFinal: 'ACEITA_PELA_OCS' | 'PRAZO_VENCIDO' | 'CONTESTACAO_ACATADA' | 'EM_ANDAMENTO';
  seloFinal: string;
  itens: ItemAndamentoGlosa[];
}

/** Detalhe da fatura para a auditoria (T26-BE1): o detalhe da lisura e o andamento da glosa por Guia. */
export type FaturaAuditoriaDetalhe = FaturaLisuraDetalhe & { andamentoGlosa?: AndamentoGlosa[] };

/** Cliente HTTP da tela de Faturas Recebidas da auditoria (T26-FE1). */
export interface AuditoriaApi {
  listarFaturas(): Promise<FaturaAuditoriaResumo[]>;
  /** Detalhe da fatura em auditoria (só leitura, T26-FE2). */
  detalhar(id: number): Promise<FaturaAuditoriaDetalhe>;
  /** PDF da Guia para a auditoria (só consulta). */
  obterPdfGuia(guiaId: number): Promise<Blob>;
  /** Marca a fatura como visualizada: encerra o fluxo no Nexus. */
  visualizar(id: number, responsavel: string): Promise<FaturaLisuraDetalhe>;
  /** Faturas que a auditoria já visualizou (T26-FE4). */
  listarAnalisadas(): Promise<FaturaAnalisadaResumo[]>;
}

/** Fatura já visualizada pela auditoria (AuditoriaAnalisadaResponse, T26-BE3). */
export interface FaturaAnalisadaResumo {
  id: number;
  ocs: string;
  numeroFatura: string | null;
  dataEntrada: string;
  /** Quando a auditoria visualizou a fatura (ordena a lista, da mais recente para a mais antiga). */
  dataVisualizacao: string | null;
  responsavelVisualizacao: string | null;
  valorInformado: number;
  valorGlosa: number | null;
  valorFinal: number | null;
}
