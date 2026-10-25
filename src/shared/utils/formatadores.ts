/**
 * Formatadores e mascaras usados por varias telas.
 *
 * - "formatar*" converte um valor vindo da API para exibicao (somente leitura).
 * - "mascara*" e aplicado enquanto o usuario digita em um campo de formulario.
 */

/** Remove tudo o que nao for digito. */
export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

/** 11144477735 -> 111.444.777-35. Valores sem 11 digitos voltam como vieram. */
export function formatarCpf(cpf: string): string {
  const digitos = somenteDigitos(cpf)
  if (digitos.length !== 11) return cpf
  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`
}

/** 45872213300 -> 458722133-00. Valores sem 11 digitos voltam como vieram. */
export function formatarPrecCp(precCp: string): string {
  const digitos = somenteDigitos(precCp)
  if (digitos.length !== 11) return precCp
  return `${digitos.slice(0, 9)}-${digitos.slice(9)}`
}

/**
 * AAAA-MM-DD (ou data ISO com horario) -> DD/MM/AAAA.
 * Valor vazio vira texto vazio; valor fora do formato volta como veio.
 */
export function formatarData(iso?: string | null): string {
  if (!iso) return ''
  const partes = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso)
  return partes ? `${partes[3]}/${partes[2]}/${partes[1]}` : iso
}

/** 12987654321 -> (12) 98765-4321. Sem telefone, exibe um travessao. */
export function formatarTelefone(telefone: string | null): string {
  if (!telefone) return '—'
  const digitos = somenteDigitos(telefone)
  if (digitos.length === 11) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
  }
  if (digitos.length === 10) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  }
  return telefone
}

/** Mascara de digitacao do CPF: 000.000.000-00. */
export function mascaraCpf(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11)
  let r = d.slice(0, 3)
  if (d.length > 3) r += `.${d.slice(3, 6)}`
  if (d.length > 6) r += `.${d.slice(6, 9)}`
  if (d.length > 9) r += `-${d.slice(9, 11)}`
  return r
}

/** Mascara de digitacao do Prec CP: 000000000-00. */
export function mascaraPrecCp(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11)
  return d.length > 9 ? `${d.slice(0, 9)}-${d.slice(9)}` : d
}

/** Mascara de digitacao do celular: (00) 00000-0000. */
export function mascaraTelefone(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11)
  if (d.length <= 2) return d ? `(${d}` : ''
  let r = `(${d.slice(0, 2)}) ${d.slice(2, 7)}`
  if (d.length > 7) r += `-${d.slice(7)}`
  return r
}

/** Confere os dois digitos verificadores do CPF (recebe somente os 11 digitos). */
export function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false
  const digitoVerificador = (tamanho: number): number => {
    let soma = 0
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return digitoVerificador(9) === Number(cpf[9]) && digitoVerificador(10) === Number(cpf[10])
}
