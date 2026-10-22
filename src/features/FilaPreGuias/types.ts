export type StatusPreGuia = 'PENDENTE' | 'EM_ANALISE' | 'ATENCAO' | 'CONCLUIDA';
export type OrigemPreGuia = 'BENEFICIARIO' | 'MEDICO';

export interface ItemFila {
  id: number;
  numero: string;
  beneficiarioNome: string;
  ocsNome: string;
  origem: OrigemPreGuia;
  dataCriacao: string;
  status: StatusPreGuia;
}

export interface PaginaFila {
  total: number;
  pagina: number;
  tamanho: number;
  itens: ItemFila[];
}

export interface ConsultaFila {
  busca?: string;
  status?: StatusPreGuia | '';
  page?: number;
  size?: number;
}

export interface FilaPreGuiasApi {
  listar(consulta?: ConsultaFila): Promise<PaginaFila>;
}
