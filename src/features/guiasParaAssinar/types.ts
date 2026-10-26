/**
 * Tipos do contrato de Guias para assinar (T5-BE1 a T5-BE3).
 */

export type PapelAssinatura = 'MEDICO' | 'CHEFE'

export interface GuiaParaAssinar {
  guiaId: number
  numero: string
  beneficiarioNome: string
  pendencias: PapelAssinatura[]
}

export interface AssinaturaRegistrada {
  assinaturas: PapelAssinatura[]
  concluida: boolean
}

export type ModoPdfAssinatura = 'visualizar' | 'baixar'

export interface GuiasParaAssinarApi {
  listar(): Promise<GuiaParaAssinar[]>
  obterPdf(guiaId: number, modo: ModoPdfAssinatura): Promise<Blob>
  assinar(guiaId: number): Promise<AssinaturaRegistrada>
}
