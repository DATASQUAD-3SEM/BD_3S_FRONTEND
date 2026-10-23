function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

export function formatarCpf(cpf: string): string {
  const digitos = somenteDigitos(cpf)
  if (digitos.length !== 11) return cpf

  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`
}

export function formatarPrecCp(precCp: string): string {
  const digitos = somenteDigitos(precCp)
  if (digitos.length !== 11) return precCp

  return `${digitos.slice(0, 9)}-${digitos.slice(9)}`
}
