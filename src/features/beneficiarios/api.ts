/**
 * MOCK: o backend de beneficiarios (Chefe) ainda nao existe.
 * Troque cada corpo por get/post/put/patch de shared/api/http, mantendo as assinaturas.
 * Erros de negocio (ex.: CPF repetido = 409) devem chegar como ApiError com a mensagem.
 */
import type { Beneficiario, BeneficiarioForm } from './types'

const espera = (ms = 250) => new Promise((r) => setTimeout(r, ms))

let BASE: Beneficiario[] = [
  { id: 1, nome: 'Antonio Carlos Ferreira', cpf: '12345678900', precCp: '45872213300', dataNascimento: '1978-03-14', telefone: '(12) 99123-4567', ativo: true },
  { id: 2, nome: 'Marta Souza Lima', cpf: '98765432100', precCp: '45810020001', dataNascimento: '1952-11-02', telefone: '(12) 3653-1122', ativo: true },
  { id: 3, nome: 'João Pereira Alves', cpf: '11122233344', precCp: '45830040002', dataNascimento: '1990-07-21', telefone: '(12) 98888-0000', ativo: false },
]
let proximoId = 4

function checarDuplicado(dados: BeneficiarioForm, ignorarId?: number) {
  const outros = BASE.filter((b) => b.id !== ignorarId)
  if (outros.some((b) => b.cpf === dados.cpf)) throw new Error('Já existe um usuário com este CPF.')
  if (outros.some((b) => b.precCp === dados.precCp)) throw new Error('Já existe um beneficiário com esta Prec CP.')
}

/** GET /beneficiarios (todos; a tela filtra por situacao/busca) */
export async function listarBeneficiarios(): Promise<Beneficiario[]> {
  await espera()
  return [...BASE]
}

/** POST /beneficiarios (cria usuario BENEFICIARIO + beneficiario) */
export async function cadastrarBeneficiario(dados: BeneficiarioForm): Promise<Beneficiario> {
  await espera()
  checarDuplicado(dados)
  const novo: Beneficiario = {
    id: proximoId++,
    nome: dados.nome.trim(),
    cpf: dados.cpf,
    precCp: dados.precCp.trim(),
    dataNascimento: dados.dataNascimento,
    telefone: dados.telefone.trim(),
    ativo: true,
  }
  BASE = [...BASE, novo]
  return novo
}

/** PUT /beneficiarios/{id} (senha vazia = nao troca) */
export async function atualizarBeneficiario(id: number, dados: BeneficiarioForm): Promise<Beneficiario> {
  await espera()
  checarDuplicado(dados, id)
  const atualizado: Beneficiario = {
    id,
    nome: dados.nome.trim(),
    cpf: dados.cpf,
    precCp: dados.precCp.trim(),
    dataNascimento: dados.dataNascimento,
    telefone: dados.telefone.trim(),
    ativo: dados.ativo,
  }
  BASE = BASE.map((b) => (b.id === id ? atualizado : b))
  return atualizado
}

/** PATCH /beneficiarios/{id}/situacao  { ativo } (nunca DELETE: preserva pre-guias e Guias) */
export async function alterarSituacao(id: number, ativo: boolean): Promise<Beneficiario> {
  await espera(150)
  const atual = BASE.find((b) => b.id === id)
  if (!atual) throw new Error('Beneficiário não encontrado.')
  const atualizado = { ...atual, ativo }
  BASE = BASE.map((b) => (b.id === id ? atualizado : b))
  return atualizado
}
