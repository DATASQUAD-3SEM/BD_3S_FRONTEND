const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' })

export function formatarMoeda(valor: number): string {
  return moeda.format(valor)
}

export function contarGuias(itens: { guiaId: number }[]): number {
  return new Set(itens.map((item) => item.guiaId)).size
}
