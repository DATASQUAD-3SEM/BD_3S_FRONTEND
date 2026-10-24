export function formatarPrecCp(precCp: string): string {
  const digitos = precCp.replace(/\D/g, '')
  if (digitos.length !== 11) return precCp
  return `${digitos.slice(0, 9)}-${digitos.slice(9)}`
}

export function formatarData(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}
