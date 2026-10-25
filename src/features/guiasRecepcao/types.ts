/**
 * Tipos do contrato de Guias da recepcao (T6-BE1 e T6-BE2).
 */

export interface GuiaRecepcao {
  guiaId: number
  numero: string
  beneficiarioNome: string
  precCp: string
  ocsNome: string
  validadeAte: string
}

export type ModoPdfGuia = 'visualizar' | 'imprimir' | 'baixar'

export interface GuiasRecepcaoApi {
  buscar(busca: string): Promise<GuiaRecepcao[]>
  obterPdf(guiaId: number, modo: ModoPdfGuia): Promise<Blob>
}
