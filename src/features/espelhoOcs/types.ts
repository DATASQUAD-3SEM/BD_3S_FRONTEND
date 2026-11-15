export interface ItemEspelho {
  guiaId: number
  numeroGuia: string
  paciente: string
  codDgp: string
  descricao: string
  quantidadeSessoes: number
  valorSessao: number
  valorTotal: number
}

export interface Espelho {
  id: number | null
  dataInicio: string | null
  dataEnvio: string | null
  itens: ItemEspelho[]
  valorTotal: number
}
