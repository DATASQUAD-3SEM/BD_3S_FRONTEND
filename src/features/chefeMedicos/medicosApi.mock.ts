import { ApiError } from '../../shared/api/http'
import { somenteDigitos } from '../../shared/utils/formatadores'
import type { MedicoDetalhe, MedicosApi, SituacaoFiltro } from './tipos'

/**
 * Implementacao em memoria do contrato T8-BE1 a T8-BE4, usada nos testes e no desenvolvimento sem backend.
 */

const registros: MedicoDetalhe[] = [
  { id: 1, nome: 'Cap Méd Ribeiro', patente: 'Capitão', cpf: '22233344455', precCp: '45890010003', crm: '000000-SP', ativo: true },
  { id: 2, nome: 'Maj Méd Teixeira', patente: 'Major', cpf: '55566677788', precCp: '45890020004', crm: '111111-SP', ativo: true },
  { id: 3, nome: 'Ten Méd Andrade', patente: 'Tenente', cpf: '99988877766', precCp: '45890030005', crm: '222222-SP', ativo: false },
]
let proximoId = 4

function encontrar(id: number): MedicoDetalhe {
  const medico = registros.find((m) => m.id === id)
  if (!medico) throw new ApiError(404, 'Médico não encontrado.')
  return medico
}

function filtrar(busca: string, situacao: SituacaoFiltro): MedicoDetalhe[] {
  const termo = busca.trim().toLowerCase()
  const digitos = somenteDigitos(termo)
  return registros.filter((m) => {
    if (situacao === 'ativos' && !m.ativo) return false
    if (situacao === 'inativos' && m.ativo) return false
    if (!termo) return true
    return (
      m.nome.toLowerCase().includes(termo) ||
      m.crm.toLowerCase().includes(termo) ||
      (digitos !== '' && (m.cpf.includes(digitos) || m.precCp.includes(digitos)))
    )
  })
}

/** Mesmas regras do backend: CPF, Prec CP e CRM não se repetem entre médicos diferentes. */
function verificarDuplicidade(id: number | null, dados: { cpf: string; precCp: string; crm: string }) {
  const outros = registros.filter((m) => m.id !== id)
  if (outros.some((m) => m.cpf === dados.cpf)) {
    throw new ApiError(409, 'CPF já cadastrado', ['cpf: CPF já cadastrado'])
  }
  if (outros.some((m) => m.precCp === dados.precCp)) {
    throw new ApiError(409, 'Prec CP já cadastrado', ['precCp: Prec CP já cadastrado'])
  }
  if (outros.some((m) => m.crm === dados.crm)) {
    throw new ApiError(409, 'CRM já cadastrado', ['crm: CRM já cadastrado'])
  }
}

export const medicosMock: MedicosApi = {
  async listar({ busca, situacao, page, size }) {
    const itens = filtrar(busca, situacao).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    return {
      total: itens.length,
      pagina: page,
      tamanho: size,
      itens: itens
        .slice(page * size, page * size + size)
        .map(({ id, nome, cpf, precCp, crm, ativo }) => ({ id, nome, cpf, precCp, crm, ativo })),
    }
  },

  async cadastrar(dados) {
    const cpf = somenteDigitos(dados.cpf)
    const precCp = somenteDigitos(dados.precCp)
    const crm = dados.crm.trim().toUpperCase()
    verificarDuplicidade(null, { cpf, precCp, crm })
    const id = proximoId++
    registros.push({ id, nome: dados.nome.trim(), patente: dados.patente.trim(), cpf, precCp, crm, ativo: true })
    return { id }
  },

  async buscar(id) {
    return { ...encontrar(id) }
  },

  async editar(id, dados) {
    const medico = encontrar(id)
    const cpf = somenteDigitos(dados.cpf)
    const precCp = somenteDigitos(dados.precCp)
    const crm = dados.crm.trim().toUpperCase()
    verificarDuplicidade(id, { cpf, precCp, crm })
    Object.assign(medico, {
      nome: dados.nome.trim(),
      patente: dados.patente.trim(),
      cpf,
      precCp,
      crm,
      ativo: dados.ativo,
    })
    return { ...medico }
  },

  async alterarSituacao(id, ativo) {
    encontrar(id).ativo = ativo
    return { id, ativo }
  },
}
