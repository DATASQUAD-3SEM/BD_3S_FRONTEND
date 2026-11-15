import { formatarData } from '../../shared/utils/formatadores'
import type { Espelho } from './types'

export function formatarPeriodo(inicio: string | null, envio: string | null): string {
  return `${formatarData(inicio)} a ${formatarData(envio)}`
}

export function encontrarEspelhoEnviado(lista: Espelho[], id: number): Espelho | null {
  return lista.find((espelho) => espelho.id === id) ?? null
}
