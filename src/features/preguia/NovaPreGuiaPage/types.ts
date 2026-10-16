export interface NovaPreGuiaForm {
  ocsId: number | null
  arquivo: File | null
}

export const formVazio: NovaPreGuiaForm = {
  ocsId: null,
  arquivo: null,
}
