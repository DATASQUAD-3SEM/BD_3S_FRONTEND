/**
 * Estado do formulario da Nova pre-guia do beneficiario (Sprint 1).
 */

export interface NovaPreGuiaForm {
  ocsId: number | null
  arquivo: File | null
}

export const formVazio: NovaPreGuiaForm = {
  ocsId: null,
  arquivo: null,
}
