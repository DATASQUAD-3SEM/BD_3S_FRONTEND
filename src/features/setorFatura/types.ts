/**
 * Tipos do Setor de Faturas (T24-FE), alinhados ao contrato do backend:
 *   - GET /setor-fatura/faturas          -> FaturaResumoResponse[]  (T24-BE2, sem as Auditadas)
 *   - GET /setor-fatura/faturas/{id}     -> FaturaDetalheResponse    (detalhe com linhas e controle de fluxo)
 *   - GET /setor-fatura/faturas-auditadas -> FaturaAuditadaResponse[] (T24-BE5 / T24-FE4)
 *
 * A situacao vem como o nome do enum SituacaoFatura do backend (RECEBIDO = "Sem nº de fatura").
 * Os campos datetime chegam em ISO (ex.: "2026-01-15T10:00:00"); valorTotal/valores sao BigDecimal (numero).
 */

export type SituacaoFatura =
  | 'RECEBIDO' // Sem nº de fatura (amarelo): espelho recebido, ainda sem protocolo.
  | 'PROTOCOLADA' // Protocolada (azul).
  | 'EM_LISURA' // Em lisura (roxo).
  | 'AGUARDANDO_OCS' // Aguardando a OCS (azul claro).
  | 'EM_AUDITORIA' // Em auditoria (laranja).
  | 'AUDITADA' // Auditada (aba própria, T24-FE4; não aparece na lista de recebidos).
  ;

/** Resumo de um espelho/fatura (FaturaResumoResponse). */
export interface EspelhoResumo {
  id: number;
  ocs: string;
  /** Início do período (dataCriacao do espelho), ISO. */
  dataInicio: string;
  /** Data em que a OCS enviou o espelho, ISO. */
  dataEnvio: string;
  /** Entrada no FUSEX (= dataEnvio), ISO. */
  dataEntrada: string;
  situacao: SituacaoFatura;
  /** Nº da fatura "XXX/XXXX" quando protocolada+; null enquanto for só espelho. */
  numeroFatura: string | null;
  valorTotal: number;
  /** Envio mais recente à OCS, ISO; null se não houve envio (regra 12.8, aviso de prazo). */
  dataEnvioOcs?: string | null;
  /** Prazo da OCS: 23:59:59 do 3º dia útil após o envio, ISO. */
  prazoOcs?: string | null;
  /** Ciência da OCS depois do envio mais recente, ISO. */
  dataCiencia?: string | null;
}

/** Linha da tabela do detalhe (LinhaResponse): uma guia/procedimento do espelho. */
export interface LinhaEspelho {
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
  origemContrato: string | null;
  observacao: string | null;
  glosa: number | null;
  comparacao: string | null;
}

/** Totais do detalhe (TotaisResponse). `final` é o nome serializado do campo valorFinal (@JsonProperty). */
export interface TotaisEspelho {
  informado: number;
  glosa: number | null;
  final: number | null;
}

/** Evento da fatura (EventoResponse): histórico de protocolo, lisura, envio à OCS, auditoria, arquivo. */
export interface EventoFatura {
  tipo: string;
  data: string;
  usuario: string;
  responsavel: string | null;
  motivo: string | null;
}

/** Etapa do controle de fluxo da fatura (EtapaResponse): Protocolo, Lisura / Glosa, Glosa / OCS, Auditagem, Arquivo. */
export interface EtapaFluxoFatura {
  etapa: string;
  setor: string;
  /** ISO; null quando a etapa ainda não começou. */
  dataEntrada: string | null;
  /** ISO; null quando a etapa está em andamento. */
  dataSaida: string | null;
  responsavel: string | null;
  valorInicial: number | null;
  valorFinal: number | null;
  motivo: string | null;
}

/** Detalhe de um espelho/fatura (FaturaDetalheResponse). */
export interface EspelhoDetalhe {
  id: number;
  ocs: string;
  dataInicio: string;
  dataEnvio: string;
  dataEntrada: string;
  situacao: SituacaoFatura;
  numeroFatura: string | null;
  valorTotal: number;
  linhas: LinhaEspelho[];
  totais: TotaisEspelho;
  eventos: EventoFatura[];
  controleFluxo: EtapaFluxoFatura[];
  dataEnvioOcs?: string | null;
  prazoOcs?: string | null;
  dataCiencia?: string | null;
  responsavelCiencia?: string | null;
}

/** Corpo do protocolo da fatura (T24-BE3). */
export interface ProtocolarFaturaRequest {
  numeroFatura: string;
  responsavel: string;
}

/** Corpo do envio para a rastreabilidade (T24-BE4). */
export interface EnviarLisuraRequest {
  responsavel: string;
}

/** Fatura já auditada (FaturaAuditadaResponse, T24-BE). Só leitura. */
export interface FaturaAuditada {
  id: number;
  ocs: string;
  dataInicio: string;
  dataEnvio: string;
  numeroFatura: string | null;
  dataEntrada: string;
  /** Quando a auditoria visualizou a fatura; null se não registrado. */
  dataVisualizacao: string | null;
  valorInformado: number;
  valorGlosa: number | null;
  valorFinal: number | null;
}

/** Cliente HTTP do Setor de Faturas (T24-FE1 a T24-FE4). */
export interface SetorFaturasApi {
  /** Faturas auditadas (aba própria, T24-FE4). */
  listarAuditadas(): Promise<FaturaAuditada[]>;
  /** Lista os espelhos recebidos e as faturas em andamento (sem as Auditadas). */
  listarEspelhosRecebidos(): Promise<EspelhoResumo[]>;
  /** Detalhe de um espelho/fatura (guias + controle de fluxo). */
  detalharEspelho(id: number): Promise<EspelhoDetalhe>;
  /** Sugestao do proximo nº da fatura da OCS no ano (so sugere; nao reserva). */
  proximoNumeroFatura(id: number): Promise<string>;
  /** Protocola o espelho: vira fatura Protocolada com o nº informado. */
  protocolarFatura(id: number, corpo: ProtocolarFaturaRequest): Promise<EspelhoDetalhe>;
  /** Envia a fatura Protocolada para a rastreabilidade (vira Em lisura). */
  enviarParaLisura(id: number, corpo: EnviarLisuraRequest): Promise<EspelhoDetalhe>;
}
