/** Regras puras do formulário de dependente (T31-FE3): idade, maioridade e vigência sugerida do menor. */

export const MAIORIDADE = 18

/** Idade completa em anos numa data (yyyy-mm-dd). */
export function idadeEm(nascimentoIso: string, hoje: Date = new Date()): number | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(nascimentoIso)
  if (!m) return null
  const [ano, mes, dia] = [Number(m[1]), Number(m[2]), Number(m[3])]
  let idade = hoje.getFullYear() - ano
  if (hoje.getMonth() + 1 < mes || (hoje.getMonth() + 1 === mes && hoje.getDate() < dia)) idade--
  return idade < 0 ? null : idade
}

export function ehMenor(nascimentoIso: string, hoje: Date = new Date()): boolean {
  const idade = idadeEm(nascimentoIso, hoje)
  return idade !== null && idade < MAIORIDADE
}

/** Vigência sugerida do menor: o dia em que completa 22 anos, menos um dia (yyyy-mm-dd). */
export function vigenciaSugerida(nascimentoIso: string): string {
  const [ano, mes, dia] = nascimentoIso.split('-').map(Number)
  const data = new Date(Date.UTC(ano + 22, mes - 1, dia))
  data.setUTCDate(data.getUTCDate() - 1)
  return data.toISOString().slice(0, 10)
}

/** Erros 422 do servidor por campo: detalhes no formato "campo: mensagem". */
export function errosPorCampo(detalhes: string[]): Record<string, string> {
  const erros: Record<string, string> = {}
  for (const linha of detalhes) {
    const achado = /^([A-Za-z.]+):\s*(.*)$/.exec(linha)
    if (achado) erros[achado[1]] = achado[2]
  }
  return erros
}
