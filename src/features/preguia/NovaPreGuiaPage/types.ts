/**
 * ESTADO COMPARTILHADO da tela "Nova pre-guia". Cada componente recebe e devolve sua FATIA.
 * Mudou algo aqui? Avise o grupo: todos os componentes dependem deste arquivo.
 */
export interface DadosBeneficiarioForm {
  nome: string
  idade: string
  precCp: string
  cpf: string
  telefone: string
}

export interface NovaPreGuiaForm {
  beneficiario: DadosBeneficiarioForm
  ocsId: number | null
  procedimentoIds: number[]
  arquivo: File | null
}

export const formVazio: NovaPreGuiaForm = {
  beneficiario: { nome: '', idade: '', precCp: '', cpf: '', telefone: '' },
  ocsId: null,
  procedimentoIds: [],
  arquivo: null,
}

export function beneficiarioCompleto(b: DadosBeneficiarioForm): boolean {
  return (
    b.nome.trim() !== '' &&
    b.idade.trim() !== '' &&
    b.precCp.trim() !== '' &&
    b.cpf.trim() !== '' &&
    b.telefone.trim() !== ''
  )
}

