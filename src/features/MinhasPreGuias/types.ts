export type StatusPreGuia = 'PENDENTE' | 'EM_ANALISE' | 'ATENCAO' | 'CONCLUIDA';

export type OrigemPreGuia = 'BENEFICIARIO' | 'MEDICO';

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
}

export interface MinhasPreGuiasApi {
  listar(): Promise<PreGuiaDoBeneficiario[]>;
  obterPdf(id: number, modo: ModoPdf): Promise<Blob>;
}
