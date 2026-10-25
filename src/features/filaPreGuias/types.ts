import type { OrigemPreGuia, StatusPreGuia } from '../../shared/types/domain';

export type { OrigemPreGuia, StatusPreGuia };

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
