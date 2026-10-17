/**
 * MOCK: o backend de cadastro de medicos (Chefe) ainda nao existe.
 * Troque cada corpo por get/post/put/patch de shared/api/http, mantendo as assinaturas.
 * Erros de negocio (CPF/Prec CP/CRM repetido = 409) devem chegar como ApiError com a mensagem.
 * (Separado do api.ts, que e do fluxo de pre-guia do medico; pode unir depois.)
 */
import type { Medico, MedicoForm } from './MedicosPage/types'

const espera = (ms = 250) => new Promise((r) => setTimeout(r, ms))

let BASE: Medico[] = [
  { id: 1, nome: 'Helena Duarte Quintanilha', patente: 'Maj Med', cpf: '12345678901', precCp: '00987654321', crm: 'CRM-SP 123456', ativo: true },
  { id: 2, nome: 'Roberto Matos Bastos', patente: 'Cap Med', cpf: '22233344455', precCp: '00123456789', crm: 'CRM-RJ 654321', ativo: true },
  { id: 3, nome: 'Sérgio Lemos Vieira', patente: 'Ten Cel Med', cpf: '33344455566', precCp: '00555666777', crm: 'CRM-SP 112233', ativo: false },
]
let proximoId = 4

function checarDuplicado(dados: MedicoForm, ignorarId?: number) {
  const outros = BASE.filter((m) => m.id !== ignorarId)
  if (outros.some((m) => m.cpf === dados.cpf)) throw new Error('Já existe um usuário com este CPF.')
  if (outros.some((m) => m.precCp === dados.precCp)) throw new Error('Já existe um médico com esta Prec CP.')
  if (outros.some((m) => m.crm.toLowerCase() === dados.crm.trim().toLowerCase())) {
    throw new Error('Já existe um médico com este CRM.')
  }
}

/** GET /medicos (todos; a tela filtra por situacao/busca) */
export async function listarMedicos(): Promise<Medico[]> {
  await espera()
  return [...BASE]
}

/** POST /medicos (cria usuario MEDICO + medico_fusex) */
export async function cadastrarMedico(dados: MedicoForm): Promise<Medico> {
  await espera()
  checarDuplicado(dados)
  const novo: Medico = {
    id: proximoId++,
    nome: dados.nome.trim(),
    patente: dados.patente.trim(),
    cpf: dados.cpf,
    precCp: dados.precCp,
    crm: dados.crm.trim(),
    ativo: true,
  }
  BASE = [...BASE, novo]
  return novo
}

/** PUT /medicos/{id} (senha vazia = nao troca) */
export async function atualizarMedico(id: number, dados: MedicoForm): Promise<Medico> {
  await espera()
  checarDuplicado(dados, id)
  const atualizado: Medico = {
    id,
    nome: dados.nome.trim(),
    patente: dados.patente.trim(),
    cpf: dados.cpf,
    precCp: dados.precCp,
    crm: dados.crm.trim(),
    ativo: dados.ativo,
  }
  BASE = BASE.map((m) => (m.id === id ? atualizado : m))
  return atualizado
}

/** PATCH /medicos/{id}/situacao  { ativo } (nunca DELETE: preserva pre-guias e assinaturas) */
export async function alterarSituacaoMedico(id: number, ativo: boolean): Promise<Medico> {
  await espera(150)
  const atual = BASE.find((m) => m.id === id)
  if (!atual) throw new Error('Médico não encontrado.')
  const atualizado = { ...atual, ativo }
  BASE = BASE.map((m) => (m.id === id ? atualizado : m))
  return atualizado
}
