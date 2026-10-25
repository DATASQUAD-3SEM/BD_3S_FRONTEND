/** Contratos T9-BE1 a T9-BE4 (correção da pré-guia pelo beneficiário). */

export interface CorrecaoPreGuia {
  numero: string;
  status: 'ATENCAO';
  beneficiario: { nome: string; precCp: string };
  dataCriacao: string;
  observacao: { texto: string; dataRegistro: string };
  encaminhamentoAtual: { nome: string; tipo: string; dataEnvio: string };
  ocsAtual: { id: number; nome: string };
}

export interface OcsBusca {
  id: number;
  nome: string;
  contrato: string;
  tipo: string;
}

/** Resposta de GET /ocs?busca= (mesmo formato usado pela Nova pré-guia do médico). */
export interface OcsBuscaResposta {
  resultados: OcsBusca[];
  total: number;
}

export interface DadosReenvio {
  /** Omitido quando a OCS não muda. */
  ocsId?: number;
  /** Omitido quando o encaminhamento não muda. */
  arquivo?: File;
}

export interface RespostaReenvio {
  status: 'PENDENTE';
  dataReenvio: string;
}

export interface CorrecaoApi {
  /** GET /beneficiarios/me/pre-guias/{id}/correcao (T9-BE1) */
  obterCorrecao(id: number): Promise<CorrecaoPreGuia>;
  /** GET /beneficiarios/me/pre-guias/{id}/encaminhamento/arquivo (T9-BE2) */
  buscarEncaminhamento(id: number): Promise<Blob>;
  /** GET /ocs?busca= (sem termo devolve a lista inicial) */
  buscarOcs(busca: string): Promise<OcsBusca[]>;
  /** POST /beneficiarios/me/pre-guias/{id}/reenvio (T9-BE4) */
  reenviar(id: number, dados: DadosReenvio): Promise<RespostaReenvio>;
}
