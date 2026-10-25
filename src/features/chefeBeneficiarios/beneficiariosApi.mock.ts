import { ApiError } from '../../shared/api/http'
import { calcularIdade } from '../beneficiario/calculosBeneficiario'
import { faixaEtariaDe } from './validacaoBeneficiario'
import { somenteDigitos } from '../../shared/utils/formatadores'
import type {
  BeneficiarioDetalhe,
  BeneficiariosApi,
  SituacaoFiltro,
} from './tipos'

interface Registro {
  id: number
  nome: string
  cpf: string
  precCp: string
  dataNascimento: string
  telefone: string
  ativo: boolean
}

const registros: Registro[] = [
  {
    id: 1,
    nome: 'Antonio Carlos Ferreira',
    cpf: '12345678900',
    precCp: '45872213300',
    dataNascimento: '1968-05-10',
    telefone: '11987654321',
    ativo: true,
  },
  {
    id: 2,
    nome: 'Marta Souza Lima',
    cpf: '98765432100',
    precCp: '45810020001',
    dataNascimento: '1985-11-02',
    telefone: '21976543210',
    ativo: true,
  },
  {
    id: 3,
    nome: 'João Pereira Alves',
    cpf: '11122233344',
    precCp: '45830040002',
    dataNascimento: '1975-03-21',
    telefone: '11998877665',
    ativo: false,
  },
]
let proximoId = 4

function encontrar(id: number): Registro {
  const registro = registros.find((r) => r.id === id)
  if (!registro) throw new ApiError(404, 'Beneficiário não encontrado.')
  return registro
}

function detalheDe(r: Registro): BeneficiarioDetalhe {
  const idade = calcularIdade(r.dataNascimento) ?? 0
  return { ...r, faixaEtaria: faixaEtariaDe(idade), idade }
}

function filtrar(busca: string, situacao: SituacaoFiltro): Registro[] {
  const termo = busca.trim().toLowerCase()
  const digitos = somenteDigitos(termo)
  return registros.filter((r) => {
    if (situacao === 'ativos' && !r.ativo) return false
    if (situacao === 'inativos' && r.ativo) return false
    if (!termo) return true
    return (
      r.nome.toLowerCase().includes(termo) ||
      (digitos !== '' && (r.cpf.includes(digitos) || r.precCp.includes(digitos)))
    )
  })
}

export const beneficiariosMock: BeneficiariosApi = {
  async listar({ busca, situacao, page, size }) {
    const itens = filtrar(busca, situacao).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
    return {
      total: itens.length,
      pagina: page,
      tamanho: size,
      itens: itens
        .slice(page * size, page * size + size)
        .map(({ id, nome, cpf, precCp, ativo }) => ({ id, nome, cpf, precCp, ativo })),
    }
  },

  async cadastrar(dados) {
    const cpf = somenteDigitos(dados.cpf)
    const precCp = somenteDigitos(dados.precCp)
    if (registros.some((r) => r.cpf === cpf)) {
      throw new ApiError(409, 'CPF ja cadastrado', ['cpf: CPF ja cadastrado'])
    }
    if (registros.some((r) => r.precCp === precCp)) {
      throw new ApiError(409, 'Prec CP ja cadastrado', ['precCp: Prec CP ja cadastrado'])
    }
    const id = proximoId++
    registros.push({
      id,
      nome: dados.nome.trim(),
      cpf,
      precCp,
      dataNascimento: dados.dataNascimento,
      telefone: somenteDigitos(dados.telefone),
      ativo: true,
    })
    return { id }
  },

  async buscar(id) {
    return detalheDe(encontrar(id))
  },

  async editar(id, dados) {
    const registro = encontrar(id)
    const cpf = somenteDigitos(dados.cpf)
    if (registros.some((r) => r.id !== id && r.cpf === cpf)) {
      throw new ApiError(409, 'CPF ja cadastrado', ['cpf: CPF ja cadastrado'])
    }
    Object.assign(registro, {
      nome: dados.nome.trim(),
      cpf,
      precCp: somenteDigitos(dados.precCp),
      dataNascimento: dados.dataNascimento,
      telefone: somenteDigitos(dados.telefone),
      ativo: dados.ativo,
    })
    return detalheDe(registro)
  },

  async alterarSituacao(id, ativo) {
    encontrar(id).ativo = ativo
    return { id, ativo }
  },
}
