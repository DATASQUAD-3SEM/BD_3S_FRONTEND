/**
 * TIPOS DO DOMINIO compartilhados por varias telas: status e origem da pre-guia e os dados dos perfis logados.
 * Nao recrie estes tipos em outro arquivo. Contratos usados por uma unica tela ficam no types.ts da propria feature.
 * Datas chegam como texto ISO ("2026-09-23" ou "2026-09-23T14:30:00").
 */

export type StatusPreGuia = 'PENDENTE' | 'EM_ANALISE' | 'ATENCAO' | 'CONCLUIDA'

export type OrigemPreGuia = 'BENEFICIARIO' | 'MEDICO'

export interface Beneficiario {
  nome: string
  cpf: string
  precCp: string
  telefone: string | null
  dataNascimento?: string | null
  grupo?: string | null
  assinaturaCadastrada?: boolean
}

export interface MedicoPerfil {
  nome: string
  patente: string
  cpf: string
  precCp: string
  crm: string
  assinaturaCadastrada: boolean
}

export interface ChefePerfil {
  nome: string
  patente: string
  login: string
  assinaturaCadastrada: boolean
}
