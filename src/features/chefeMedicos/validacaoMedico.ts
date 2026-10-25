import { ApiError } from '../../shared/api/http'

/** Campos do formulário. Servem para ligar o erro 422/409 do backend ao campo certo. */
export type CampoMedico = 'nome' | 'patente' | 'cpf' | 'precCp' | 'crm' | 'senha' | 'novaSenha' | 'ativo'

export type ErrosMedico = Partial<Record<CampoMedico, string>>

export interface ValoresFormulario {
  nome: string
  patente: string
  cpf: string
  precCp: string
  crm: string
  senha: string
  novaSenha: string
  ativo: boolean
}

const CAMPOS: CampoMedico[] = ['nome', 'patente', 'cpf', 'precCp', 'crm', 'senha', 'novaSenha', 'ativo']
const NOME_MAXIMO = 150
const PATENTE_MAXIMA = 50
const SENHA_MINIMA = 8
const SENHA_MAXIMA = 72
const CRM_FORMATO = /^\d{4,7}[-/ ]?[A-Za-z]{2}$/
const UFS = new Set([
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
])

export const somenteDigitos = (valor: string): string => valor.replace(/\D/g, '')

export function mascaraCpf(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11)
  let r = d.slice(0, 3)
  if (d.length > 3) r += `.${d.slice(3, 6)}`
  if (d.length > 6) r += `.${d.slice(6, 9)}`
  if (d.length > 9) r += `-${d.slice(9, 11)}`
  return r
}

export function mascaraPrecCp(valor: string): string {
  const d = somenteDigitos(valor).slice(0, 11)
  return d.length > 9 ? `${d.slice(0, 9)}-${d.slice(9)}` : d
}

/** Exibição na tabela: 000000-SP vira 000.000-SP. */
export function mascaraCrm(valor: string): string {
  const m = /^(\d+)-([A-Z]{2})$/.exec(valor)
  if (!m) return valor
  return `${m[1].replace(/\B(?=(\d{3})+(?!\d))/g, '.')}-${m[2]}`
}

function cpfValido(cpf: string): boolean {
  if (!/^\d{11}$/.test(cpf) || /^(\d)\1{10}$/.test(cpf)) return false
  const digito = (tamanho: number): number => {
    let soma = 0
    for (let i = 0; i < tamanho; i++) soma += Number(cpf[i]) * (tamanho + 1 - i)
    const resto = (soma * 10) % 11
    return resto === 10 ? 0 : resto
  }
  return digito(9) === Number(cpf[9]) && digito(10) === Number(cpf[10])
}

export function crmValido(valor: string): boolean {
  const limpo = valor.trim()
  return CRM_FORMATO.test(limpo) && UFS.has(limpo.slice(-2).toUpperCase())
}

function validarSenha(senha: string, campo: 'senha' | 'novaSenha', erros: ErrosMedico) {
  if (senha.length < SENHA_MINIMA || senha.length > SENHA_MAXIMA) {
    erros[campo] = `A senha deve ter entre ${SENHA_MINIMA} e ${SENHA_MAXIMA} caracteres.`
  }
}

export function validarFormulario(v: ValoresFormulario, modo: 'cadastro' | 'edicao'): ErrosMedico {
  const erros: ErrosMedico = {}

  const nome = v.nome.trim()
  if (!nome) erros.nome = 'O nome é obrigatório.'
  else if (nome.length > NOME_MAXIMO) erros.nome = `O nome deve ter no máximo ${NOME_MAXIMO} caracteres.`

  const patente = v.patente.trim()
  if (!patente) erros.patente = 'A patente é obrigatória.'
  else if (patente.length > PATENTE_MAXIMA) {
    erros.patente = `A patente deve ter no máximo ${PATENTE_MAXIMA} caracteres.`
  }

  const cpf = somenteDigitos(v.cpf)
  if (!cpf) erros.cpf = 'Informe o CPF.'
  else if (!cpfValido(cpf)) erros.cpf = 'CPF inválido.'

  if (somenteDigitos(v.precCp).length !== 11) erros.precCp = 'O Prec CP deve ter 11 dígitos.'

  if (!v.crm.trim()) erros.crm = 'Informe o CRM.'
  else if (!crmValido(v.crm)) erros.crm = 'Use número e UF, ex.: 123456-SP.'

  if (modo === 'cadastro') {
    if (!v.senha) erros.senha = 'Informe a senha inicial.'
    else validarSenha(v.senha, 'senha', erros)
  } else if (v.novaSenha) {
    validarSenha(v.novaSenha, 'novaSenha', erros)
  }

  return erros
}

const ehCampo = (valor: string): valor is CampoMedico => (CAMPOS as string[]).includes(valor)

/** Converte o ErrorResponse do backend em erros por campo (ou mensagem geral). */
export function errosDoBackend(erro: unknown): { campos: ErrosMedico; geral: string | null } {
  if (!(erro instanceof ApiError)) {
    return { campos: {}, geral: 'Não foi possível salvar. Tente novamente.' }
  }

  const campos: ErrosMedico = {}
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
