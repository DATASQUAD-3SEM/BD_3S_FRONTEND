/** 11 dígitos viram 000000000-00. Outros valores voltam como vieram. */
export function formatarPrecCp(valor: string): string {
  const digitos = valor.replace(/\D/g, '')
  return digitos.length === 11 ? `${digitos.slice(0, 9)}-${digitos.slice(9)}` : valor
}

/** Converte AAAA-MM-DD (ou ISO com horário) para DD/MM/AAAA. */
export function formatarData(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso
}
