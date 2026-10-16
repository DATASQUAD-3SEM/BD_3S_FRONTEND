/** 12345678900 -> 123.456.789-00 (so exibicao). Devolve o original se nao tiver 11 digitos. */
export function formatarCpf(valor: string): string {
  const d = valor.replace(/\D/g, '')
  if (d.length !== 11) return valor
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** 45872213300 -> 458722133-00 (so exibicao). Devolve o original se nao tiver 11 digitos. */
export function formatarPrecCp(valor: string): string {
  const d = valor.replace(/\D/g, '')
  if (d.length !== 11) return valor
  return `${d.slice(0, 9)}-${d.slice(9)}`
}

/** Idade em anos completos a partir de "yyyy-mm-dd". */
export function calcularIdade(nascimentoIso: string, hoje = new Date()): number {
  const n = new Date(`${nascimentoIso}T00:00:00`)
  let idade = hoje.getFullYear() - n.getFullYear()
  const aindaNaoFez =
    hoje.getMonth() < n.getMonth() ||
    (hoje.getMonth() === n.getMonth() && hoje.getDate() < n.getDate())
  if (aindaNaoFez) idade -= 1
  return idade
}

/** Mesmas faixas do DadosBeneficiario. */
export function faixaEtaria(idade: number): string {
  if (!Number.isFinite(idade)) return ''
  if (idade < 18) return 'Menor de 18'
  if (idade <= 30) return '18 a 30'
  if (idade <= 40) return '31 a 40'
  if (idade <= 50) return '41 a 50'
  if (idade <= 60) return '51 a 60'
  if (idade <= 70) return '61 a 70'
  return 'Acima de 70'
}

/** Mascara enquanto digita: so digitos (max. 11) -> 123.456.789-00 */
export function mascararCpf(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  let r = d.slice(0, 3)
  if (d.length > 3) r += `.${d.slice(3, 6)}`
  if (d.length > 6) r += `.${d.slice(6, 9)}`
  if (d.length > 9) r += `-${d.slice(9)}`
  return r
}

/** Mascara enquanto digita: so digitos (max. 11) -> 458722133-00 */
export function mascararPrecCp(valor: string): string {
  const d = valor.replace(/\D/g, '').slice(0, 11)
  return d.length > 9 ? `${d.slice(0, 9)}-${d.slice(9)}` : d
}
