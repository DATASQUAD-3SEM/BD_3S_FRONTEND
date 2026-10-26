import { ApiError } from '../../shared/api/http'
import { calcularIdade } from '../beneficiario/calculosBeneficiario'
import { somenteDigitos, cpfValido } from '../../shared/utils/formatadores'

/**
 * Validacoes do formulario de beneficiario feitas antes do envio e leitura dos erros 422/409
 * devolvidos pelo backend, para exibir cada mensagem no campo correspondente.
 */

export type CampoBeneficiario =
  | 'nome'
  | 'cpf'
  | 'precCp'
  | 'dataNascimento'
  | 'telefone'
  | 'senha'
  | 'novaSenha'
  | 'ativo'

export type ErrosBeneficiario = Partial<Record<CampoBeneficiario, string>>

export interface ValoresFormulario {
  nome: string
  cpf: string
  precCp: string
  dataNascimento: string
  telefone: string
  senha: string
  novaSenha: string
  ativo: boolean
}

const CAMPOS: CampoBeneficiario[] = [
  'nome',
  'cpf',
  'precCp',
  'dataNascimento',
  'telefone',
  'senha',
  'novaSenha',
  'ativo',
]
const NOME_MAXIMO = 150
const SENHA_MINIMA = 8
const SENHA_MAXIMA = 72
const REGEX_CELULAR = /^[1-9]{2}9\d{8}$/

function dataIsoLocal(data: Date): string {
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${data.getFullYear()}-${mes}-${dia}`
}

function validarSenha(senha: string, campo: 'senha' | 'novaSenha', erros: ErrosBeneficiario) {
  if (senha.length < SENHA_MINIMA || senha.length > SENHA_MAXIMA) {
    erros[campo] = `A senha deve ter entre ${SENHA_MINIMA} e ${SENHA_MAXIMA} caracteres.`
  }
}

export function validarFormulario(
  v: ValoresFormulario,
  modo: 'cadastro' | 'edicao',
  hoje: Date = new Date(),
): ErrosBeneficiario {
  const erros: ErrosBeneficiario = {}
  const nome = v.nome.trim()

  if (!nome) erros.nome = 'O nome é obrigatório.'
  else if (nome.length > NOME_MAXIMO) erros.nome = `O nome deve ter no máximo ${NOME_MAXIMO} caracteres.`

  const cpf = somenteDigitos(v.cpf)
  if (!cpf) erros.cpf = 'Informe o CPF.'
  else if (!cpfValido(cpf)) erros.cpf = 'CPF inválido.'

  if (somenteDigitos(v.precCp).length !== 11) erros.precCp = 'O Prec CP deve ter 11 dígitos.'

  if (!v.dataNascimento) erros.dataNascimento = 'Informe a data de nascimento.'
  else if (v.dataNascimento >= dataIsoLocal(hoje)) {
    erros.dataNascimento = 'A data de nascimento deve estar no passado.'
  }

  const telefone = somenteDigitos(v.telefone)
  if (!telefone) erros.telefone = 'Informe o telefone.'
  else if (!REGEX_CELULAR.test(telefone)) erros.telefone = 'Informe um celular válido com DDD.'

  if (modo === 'cadastro') {
    if (!v.senha) erros.senha = 'Informe a senha inicial.'
    else validarSenha(v.senha, 'senha', erros)
  } else if (v.novaSenha) {
    validarSenha(v.novaSenha, 'novaSenha', erros)
  }

  return erros
}

const FAIXAS: { ate: number; rotulo: string }[] = [
  { ate: 17, rotulo: 'Menor de 18' },
  { ate: 30, rotulo: '18 a 30' },
  { ate: 40, rotulo: '31 a 40' },
  { ate: 50, rotulo: '41 a 50' },
  { ate: 60, rotulo: '51 a 60' },
  { ate: 70, rotulo: '61 a 70' },
  { ate: Infinity, rotulo: 'Acima de 70' },
]

/** Mesmas faixas do backend (FaixaEtaria.java). */
export function faixaEtariaDe(idade: number): string {
  return FAIXAS.find((f) => idade <= f.ate)?.rotulo ?? ''
}

/** Idade e faixa calculadas a partir da data de nascimento, nunca gravadas. */
export function resumoFaixa(
  dataNascimento: string,
  hoje: Date = new Date(),
): { idade: number; rotulo: string } | null {
  const idade = calcularIdade(dataNascimento, hoje)
  return idade === null ? null : { idade, rotulo: faixaEtariaDe(idade) }
}

const ehCampo = (valor: string): valor is CampoBeneficiario =>
  (CAMPOS as string[]).includes(valor)

/** Converte o ErrorResponse do backend em erros por campo (ou mensagem geral). */
export function errosDoBackend(erro: unknown): {
  campos: ErrosBeneficiario
  geral: string | null
} {
  if (!(erro instanceof ApiError)) {
    return { campos: {}, geral: 'Não foi possível salvar. Tente novamente.' }
  }

  const campos: ErrosBeneficiario = {}
  const semCampo: string[] = []

  for (const detalhe of erro.detalhes) {
    const separador = detalhe.indexOf(': ')
    const campo = separador > 0 ? detalhe.slice(0, separador) : ''
    if (ehCampo(campo)) campos[campo] = detalhe.slice(separador + 2)
    else semCampo.push(detalhe)
  }

  if (semCampo.length > 0) return { campos, geral: semCampo.join(' ') }
  if (Object.keys(campos).length === 0) return { campos, geral: erro.message }
  return { campos, geral: null }
}
