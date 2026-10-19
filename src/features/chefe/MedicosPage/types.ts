/** Linha da tabela (medico_fusex + usuario: o CPF e o login). */
export interface Medico {
  id: number
  nome: string
  patente: string
  cpf: string // so digitos (usuario.login)
  precCp: string // so digitos
  crm: string
  ativo: boolean // usuario.ativo (desativar nunca apaga)
}

export interface MedicoForm {
  nome: string
  patente: string
  cpf: string
  precCp: string
  crm: string
  senha: string // novo: obrigatoria. edicao: opcional (vazia = nao troca)
  ativo: boolean
}

export type FiltroSituacao = 'ativos' | 'inativos' | 'todos'

export const formVazio: MedicoForm = {
  nome: '',
  patente: '',
  cpf: '',
  precCp: '',
  crm: '',
  senha: '',
  ativo: true,
}

export function paraForm(m: Medico): MedicoForm {
  return {
    nome: m.nome,
    patente: m.patente,
    cpf: m.cpf,
    precCp: m.precCp,
    crm: m.crm,
    senha: '',
    ativo: m.ativo,
  }
}

/** O que falta/esta invalido (a tela lista isso, como na NovaPreGuiaPage). */
export function problemasDoForm(f: MedicoForm, modo: 'novo' | 'edicao'): string[] {
  const p: string[] = []
  if (f.nome.trim() === '') p.push('nome')
  if (f.patente.trim() === '') p.push('patente')
  if (f.cpf.length !== 11) p.push('CPF com 11 dígitos')
  if (f.precCp.length !== 11) p.push('Prec CP com 11 dígitos')
  if (f.crm.trim() === '') p.push('CRM')
  if (modo === 'novo' && f.senha === '') p.push('senha inicial')
  return p
}
