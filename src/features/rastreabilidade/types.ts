import type { EtapaFluxoFatura, SituacaoFatura } from '../setorFatura/types'

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

/** Linha da lisura (LinhaResponse, T25-BE). Campos de decisão da OCS vêm do backend quando disponíveis. */
export interface LinhaLisura {
  itemId: number;
  guiaId: number;
  guiaNumero: string;
  paciente: string;
  codigo: string;
  procedimento: string;
  quantidadeSessoes: number;
  valorSessao: number;
  valorTotal: number;
  valorContrato: number | null;
  /** TABELA, TABELA_CORRIGIDA, CONFERIDO, MANUAL ou null (ainda sem decisão). */
  origemContrato: 'TABELA' | 'TABELA_CORRIGIDA' | 'CONFERIDO' | 'MANUAL' | null;
  observacao: string | null;
  glosa: number | null;
  /** SEM_CONTRATO, CONFORME, ACIMA ou ABAIXO. */
  comparacao: 'SEM_CONTRATO' | 'CONFORME' | 'ACIMA' | 'ABAIXO';
  /** Decisão da OCS no envio mais recente: "OK", "CONTESTAR" ou ausente (ver nota no plano). */
  decisaoOcs?: string | null;
  motivoContestacaoOcs?: string | null;
}

/** Detalhe da fatura para a lisura (FaturaDetalheResponse, T25-BE). */
export interface FaturaLisuraDetalhe {
  id: number;
  ocs: string;
  dataInicio: string;
  dataEnvio: string;
  dataEntrada: string;
  situacao: SituacaoFatura;
  numeroFatura: string | null;
  valorTotal: number;
  linhas: LinhaLisura[];
  totais: { informado: number; glosa: number | null; final: number | null };
  controleFluxo: EtapaFluxoFatura[];
}

/** Item enviado no PUT de lisura (ItemLisuraRequest). */
export interface ItemLisuraPedido {
  itemId: number;
  conforme?: boolean | null;
  valorContrato?: number | null;
  corrigirTabela?: boolean | null;
  observacao?: string | null;
}

export interface LisuraApi {
  detalhar(id: number): Promise<FaturaLisuraDetalhe>;
  salvarLisura(id: number, responsavel: string | null, itens: ItemLisuraPedido[]): Promise<FaturaLisuraDetalhe>;
  /** PDF da Guia, só para consulta (T25-FE-2, botão "Ver guia (PDF)"). */
  obterPdfGuia(guiaId: number): Promise<Blob>;
}
