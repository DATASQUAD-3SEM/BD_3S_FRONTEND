/**
 * Tipos do contrato da Nova pre-guia do medico (T2-BE1 a T2-BE4).
 */

export interface BeneficiarioBusca {
  id: number
  nome: string
  faixaEtaria: string
  idade: number
  cpf: string
  telefone: string | null
  /** Bloco do dependente quando o Prec CP é de um dependente vigente (T30-BE7); nulo para o titular. */
  dependente?: DependenteMedico | null
}

/** Dependente encontrado pelo Prec CP (T30-BE7). responsavel: quem age pelo menor; nulo no maior. */
export interface DependenteMedico {
  dependenteId: number
  titularNome: string
  titularPrecCp: string
  vinculo: string | null
  menor: boolean
  responsavel: string | null
}

/** GET /medicos/me (T34-BE1): dados do medico logado que vao na pre-guia. CPF e Prec CP so com digitos. */
export interface MedicoSolicitante {
  nome: string
  patente: string
  crm: string
  cpf?: string | null
  precCp?: string | null
}

export interface OcsBusca {
  id: number
  nome: string
  contrato: string
  tipo: string
}

export interface OcsBuscaResposta {
  resultados: OcsBusca[]
  total: number
}

export interface ProcedimentoBusca {
  codigoTuss: string
  nome: string
}

export interface PreGuiaCriada {
  id: number
  numero: string
  status: string
  dataCriacao: string
}

export interface CriarPreGuiaMedicoPayload {
  beneficiarioId: number
  ocsId: number
  procedimentos: string[]
  /** Paciente dependente (T30-FE5): o titular continua sendo o beneficiarioId. */
  dependenteId?: number
}
