import { ApiError } from '../../shared/api/http'

export interface DadosConta {
  nome: string
  patente: string
  login: string
  novaSenha: string
}

export type CampoDadosConta = keyof DadosConta
export type ErrosDadosConta = Partial<Record<CampoDadosConta, string>>

const TAMANHO_MINIMO_SENHA = 8
const TAMANHO_MAXIMO_NOME = 150
const TAMANHO_MAXIMO_PATENTE = 50
const TAMANHO_MAXIMO_LOGIN = 50

const CAMPOS: CampoDadosConta[] = ['nome', 'patente', 'login', 'novaSenha']

function ehCampo(valor: string): valor is CampoDadosConta {
  return (CAMPOS as string[]).includes(valor)
}

export function validarDadosConta(dados: DadosConta): ErrosDadosConta {
  const erros: ErrosDadosConta = {}
  const nome = dados.nome.trim()
  const patente = dados.patente.trim()
  const login = dados.login.trim()

  if (!nome) {
    erros.nome = 'O nome é obrigatório.'
  } else if (nome.length > TAMANHO_MAXIMO_NOME) {
    erros.nome = `O nome deve ter no máximo ${TAMANHO_MAXIMO_NOME} caracteres.`
  }

  if (!patente) {
    erros.patente = 'A patente é obrigatória.'
  } else if (patente.length > TAMANHO_MAXIMO_PATENTE) {
    erros.patente = `A patente deve ter no máximo ${TAMANHO_MAXIMO_PATENTE} caracteres.`
  }

  if (!login) {
    erros.login = 'O login é obrigatório.'
  } else if (/\s/.test(login)) {
    erros.login = 'O login não pode conter espaços.'
  } else if (login.length > TAMANHO_MAXIMO_LOGIN) {
    erros.login = `O login deve ter no máximo ${TAMANHO_MAXIMO_LOGIN} caracteres.`
  }

  if (dados.novaSenha && dados.novaSenha.length < TAMANHO_MINIMO_SENHA) {
    erros.novaSenha = `A nova senha precisa ter no mínimo ${TAMANHO_MINIMO_SENHA} caracteres.`
  }

  return erros
}

export function errosDoBackend(erro: unknown): { campos: ErrosDadosConta; geral: string | null } {
  if (!(erro instanceof ApiError)) {
    return { campos: {}, geral: 'Não foi possível salvar. Tente novamente.' }
  }

  if (erro.status === 409) {
    return { campos: { login: erro.message }, geral: null }
  }

  const campos: ErrosDadosConta = {}
  const semCampo: string[] = []

  for (const detalhe of erro.detalhes) {
    const indice = detalhe.indexOf(': ')
    const campo = indice > 0 ? detalhe.slice(0, indice) : ''
    const mensagem = indice > 0 ? detalhe.slice(indice + 2) : detalhe

    if (ehCampo(campo)) {
      campos[campo] = mensagem
    } else {
      semCampo.push(detalhe)
    }
  }

  if (semCampo.length > 0) return { campos, geral: semCampo.join(' ') }
  if (Object.keys(campos).length === 0) return { campos, geral: erro.message }
  return { campos, geral: null }
}
