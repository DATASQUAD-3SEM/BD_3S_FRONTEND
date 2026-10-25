/** 45872213300 -> 458722133-00 (máscara enquanto o usuário digita) */
export function mascaraPrecCp(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)

  return digitos.length <= 9
    ? digitos
    : `${digitos.slice(0, 9)}-${digitos.slice(9)}`
}

/** 12987654321 -> (12) 98765-4321 */
export function formatarTelefone(telefone: string | null): string {
  if (!telefone) return '—'

  const digitos = telefone.replace(/\D/g, '')

  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
  }

  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  }

  return telefone
}

/** Tipo da OCS sempre em maiúsculas, conforme a especificação. */
export function rotuloTipo(tipo: string): string {
  return tipo.toUpperCase()
}
