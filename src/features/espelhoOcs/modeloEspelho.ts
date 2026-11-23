import type { ItemEspelho } from './types'

export interface GrupoGuiaEspelho {
  guiaId: number
  numeroGuia: string
  paciente: string
  itens: ItemEspelho[]
}

export function agruparPorGuia(itens: ItemEspelho[]): GrupoGuiaEspelho[] {
  const grupos = new Map<number, GrupoGuiaEspelho>()
  for (const item of itens) {
    const grupo = grupos.get(item.guiaId)
    if (grupo) {
      grupo.itens.push(item)
    } else {
      grupos.set(item.guiaId, {
        guiaId: item.guiaId,
        numeroGuia: item.numeroGuia,
        paciente: item.paciente,
        itens: [item],
      })
    }
  }
  return [...grupos.values()]
}

export function valorParaTexto(valor: number): string {
  return valor.toFixed(2).replace('.', ',')
}

export function valoresIniciais(itens: ItemEspelho[]): Record<string, string> {
  return Object.fromEntries(itens.map((item) => [item.codDgp, valorParaTexto(item.valorSessao)]))
}
