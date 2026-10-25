import { get, post } from '../../../shared/api/http'

import type {
  BeneficiarioBusca,
  CriarPreGuiaMedicoPayload,
  MedicoSolicitante,
  OcsBuscaResposta,
  PreGuiaCriada,
  ProcedimentoBusca,
} from './types'

function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '')
}

/** GET /medicos/me */
export function obterMedicoSolicitante(): Promise<MedicoSolicitante> {
  return get<MedicoSolicitante>('/medicos/me')
}

/** GET /medicos/beneficiarios?precCp= (aceita com ou sem máscara) */
export function buscarBeneficiarioPorPrecCp(precCp: string): Promise<BeneficiarioBusca> {
  return get<BeneficiarioBusca>(`/medicos/beneficiarios?precCp=${somenteDigitos(precCp)}`)
}

/** GET /ocs?busca= (sem termo devolve a lista inicial) */
export function buscarOcsMedico(termo: string): Promise<OcsBuscaResposta> {
  const busca = termo.trim()
  const query = busca ? `?busca=${encodeURIComponent(busca)}` : ''
  return get<OcsBuscaResposta>(`/ocs${query}`)
}

/** GET /medicos/procedimentos?busca= (mínimo de 2 caracteres) */
export function buscarProcedimentosMedico(termo: string): Promise<ProcedimentoBusca[]> {
  return get<ProcedimentoBusca[]>(
    `/medicos/procedimentos?busca=${encodeURIComponent(termo.trim())}`,
  )
}

/** POST /medicos/pre-guias */
export function criarPreGuiaMedico(payload: CriarPreGuiaMedicoPayload): Promise<PreGuiaCriada> {
  return post<PreGuiaCriada>('/medicos/pre-guias', payload)
}
