import type { SituacaoFatura } from '../setorFatura/types'

/** Fatura na lista de Faturas Recebidas (FaturaLisuraResumoResponse, T25-BE3). */
export interface FaturaLisuraResumo {
  id: number;
  ocs: string;
  dataInicio: string;
  /** Data em que o setor de Faturas enviou a fatura (ordena a lista). */
  dataEnvio: string;
  dataEntrada: string;
  numeroFatura: string | null;
  /** Só "EM_LISURA" ou "AGUARDANDO_OCS": o backend já filtra as outras situações. */
  situacao: SituacaoFatura;
  valorInformado: number;
  linhasDecididas: number;
  totalLinhas: number;
  /** Quando as glosas foram enviadas à OCS; null enquanto não houve envio. */
  dataEnvioOcs: string | null;
  prazoOcs: string | null;
  /** Verdadeiro quando a OCS deu ciência ou o prazo venceu. */
  liberadaParaAuditoria: boolean;
}

/** Cliente HTTP da tela de Faturas Recebidas (T25-FE-1). */
export interface RastreabilidadeApi {
  listarFaturas(): Promise<FaturaLisuraResumo[]>;
}
