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
  arquivo: File | null
}

export const formVazio: NovaPreGuiaForm = {
  beneficiario: { nome: '', idade: '', precCp: '', cpf: '', telefone: '' },
  ocsId: null,
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
