import type { SituacaoFinalizada, ValorProcedimento } from './types'

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatarMoeda(valor: number): string {
  return moeda.format(valor)
}

export function contarGuias(itens: { guiaId: number }[]): number {
  return new Set(itens.map((item) => item.guiaId)).size
}

export function rotuloSituacao(situacao: SituacaoFinalizada): string {
  return situacao === 'REALIZADA' ? 'Realizada' : 'Encerrada'
}

export function lerValor(texto: string): number | null {
  const normalizado = texto.trim().replace(',', '.')
  if (!/^\d+(\.\d{1,2})?$/.test(normalizado)) return null
  const numero = Number(normalizado)
  return numero > 0 ? numero : null
}

export function valoresPreenchidos(
  procedimentos: { codDgp: string }[],
  valores: Record<string, string>,
): boolean {
  return procedimentos.every((procedimento) => lerValor(valores[procedimento.codDgp] ?? '') !== null)
}

export function montarValores(
  procedimentos: { codDgp: string }[],
  valores: Record<string, string>,
): ValorProcedimento[] {
  return procedimentos.map((procedimento) => ({
    codDgp: procedimento.codDgp,
    valorSessao: lerValor(valores[procedimento.codDgp] ?? '') as number,
  }))
}
