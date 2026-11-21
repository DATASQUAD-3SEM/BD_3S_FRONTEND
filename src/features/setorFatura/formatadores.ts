import { formatarData } from '../../shared/utils/formatadores'
import type { EspelhoResumo, SituacaoFatura } from './types'

/**
 * Formatadores da tela de Espelhos Recebidos (T24-FE1): moeda, rótulo e cor do selo da situação,
 * e a ordenação "do mais recente para o mais antigo" pela data de envio da OCS.
 */

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2 })

/** 1234.5 -> "R$ 1.234,50". O espaço da moeda é normalizado para espaço comum (Intl usa non-breaking). */
export function formatarMoeda(valor: number | null | undefined): string {
  if (valor === null || valor === undefined) return '—'
  return moeda.format(valor).replace(/\u00a0/g, ' ')
}

/** ISO (com ou sem horário) -> dd/mm/aaaa; vazio vira travessão. */
export function formatarDataCurta(iso: string | null | undefined): string {
  if (!iso) return '—'
  const br = formatarData(iso)
  return br || '—'
}

export const ROTULO_SITUACAO: Record<SituacaoFatura, string> = {
  RECEBIDO: 'Sem nº de fatura',
  PROTOCOLADA: 'Protocolada',
  EM_LISURA: 'Em lisura',
  AGUARDANDO_OCS: 'Aguardando a OCS',
  EM_AUDITORIA: 'Em auditoria',
  AUDITADA: 'Concluída',
}

export function rotuloSituacao(situacao: SituacaoFatura): string {
  return ROTULO_SITUACAO[situacao]
}

/** Classe do selo conforme a cor definida no protótipo (amarelo, azul, roxo, azul claro, laranja). */
export const CLASSE_SELO_SITUACAO: Record<SituacaoFatura, string> = {
  RECEBIDO: 'sf-selo--amarelo',
  PROTOCOLADA: 'sf-selo--azul',
  EM_LISURA: 'sf-selo--roxo',
  AGUARDANDO_OCS: 'sf-selo--azul-claro',
  EM_AUDITORIA: 'sf-selo--laranja',
  AUDITADA: 'sf-selo--verde',
}

export function classeSeloSituacao(situacao: SituacaoFatura): string {
  return CLASSE_SELO_SITUACAO[situacao]
}

/**
 * Aviso do prazo da OCS para o setor de Faturas (regra 12.8), só para a fatura Aguardando a OCS:
 * ciência dada, prazo vencido ou prazo em curso. Nas demais situações, null.
 */
export function avisoPrazoOcs(
  fatura: Pick<EspelhoResumo, 'situacao' | 'prazoOcs' | 'dataCiencia'> & { responsavelCiencia?: string | null },
  agora: Date = new Date(),
): string | null {
  if (fatura.situacao !== 'AGUARDANDO_OCS' || !fatura.prazoOcs) return null
  if (fatura.dataCiencia) {
    const quem = fatura.responsavelCiencia ? ` (${fatura.responsavelCiencia})` : ''
    return `A OCS deu ciência das glosas em ${formatarDataCurta(fatura.dataCiencia)}${quem}.`
  }
  const vencido = agora.getTime() > new Date(fatura.prazoOcs).getTime()
  return vencido
    ? `Prazo da OCS vencido em ${formatarDataCurta(fatura.prazoOcs)}`
    : `Prazo da OCS: até ${formatarDataCurta(fatura.prazoOcs)}`
}

/** "Espelho nº 12" enquanto não há nº de fatura; "Fatura nº 001/2026" depois. */
export function tituloDoEspelho(espelho: Pick<EspelhoResumo, 'id' | 'numeroFatura'>): string {
  return espelho.numeroFatura ? `Fatura nº ${espelho.numeroFatura}` : `Espelho nº ${espelho.id}`
}

/** Do mais recente para o mais antigo pela data de envio da OCS (desempate pelo id). */
export function ordenarPorEnvioRecente(espelhos: EspelhoResumo[]): EspelhoResumo[] {
  return [...espelhos].sort((a, b) => {
    const porData = b.dataEnvio.localeCompare(a.dataEnvio)
    return porData !== 0 ? porData : b.id - a.id
  })
}
