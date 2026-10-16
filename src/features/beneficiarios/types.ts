/** Linha da tabela (beneficiario + usuario: o CPF e o login). */
export interface Beneficiario {
  id: number
  nome: string
  cpf: string // so digitos (usuario.login)
  precCp: string // so digitos
  dataNascimento: string // yyyy-mm-dd
  telefone: string
  ativo: boolean // usuario.ativo (desativar nunca apaga)
}

export interface BeneficiarioForm {
  nome: string
  cpf: string
  precCp: string
  dataNascimento: string
  telefone: string
  senha: string // novo: obrigatoria. edicao: opcional (vazia = nao troca)
  ativo: boolean
}

export type FiltroSituacao = 'ativos' | 'inativos' | 'todos'

export const formVazio: BeneficiarioForm = {
  nome: '',
  cpf: '',
  precCp: '',
  dataNascimento: '',
  telefone: '',
  senha: '',
  ativo: true,
}

export function paraForm(b: Beneficiario): BeneficiarioForm {
  return {
    nome: b.nome,
    cpf: b.cpf,
    precCp: b.precCp,
    dataNascimento: b.dataNascimento,
    telefone: b.telefone,
    senha: '',
    ativo: b.ativo,
  }
}

/** O que falta/esta invalido (a tela lista isso, como na NovaPreGuiaPage). */
export function problemasDoForm(f: BeneficiarioForm, modo: 'novo' | 'edicao'): string[] {
  const p: string[] = []
  if (f.nome.trim() === '') p.push('nome')
  if (f.cpf.length !== 11) p.push('CPF com 11 dígitos')
  if (f.precCp.trim() === '') p.push('Prec CP')
  if (f.dataNascimento === '') p.push('data de nascimento')
  else if (new Date(`${f.dataNascimento}T00:00:00`) > new Date()) p.push('data de nascimento (não pode ser futura)')
  if (f.telefone.trim() === '') p.push('telefone')
  if (modo === 'novo' && f.senha === '') p.push('senha inicial')
  return p
}
