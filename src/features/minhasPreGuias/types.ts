import type { OrigemPreGuia, StatusPreGuia } from '../../shared/types/domain';

/**
 * Tipos do contrato de Minhas pre-guias (T1-BE1 e T1-BE2).
 */

export type { OrigemPreGuia, StatusPreGuia };
import type { PacienteDaLista } from './paciente';

export type ModoPdf = 'baixar' | 'visualizar';

export interface PreGuiaDoBeneficiario {
  id: number;
  numero: string;
  ocsNome: string;
  origem: OrigemPreGuia;
  criadoPorMedico?: { patente: string; nome: string };
  dataCriacao: string;
  status: StatusPreGuia;
  observacao?: string;
  guia?: { numero: string; validadeAte: string };
  /** Paciente da pre-guia (T30-BE3): titular ou dependente. */
  paciente?: PacienteDaLista;
}

export interface MinhasPreGuiasApi {
  listar(): Promise<PreGuiaDoBeneficiario[]>;
  obterPdf(id: number, modo: ModoPdf): Promise<Blob>;
}
