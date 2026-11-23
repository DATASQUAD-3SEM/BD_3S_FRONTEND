/**
 * Tipos dos dependentes do titular (T31-BE1 a T31-BE3), na visão do chefe do FUSEX.
 *   - GET  /chefe/beneficiarios/{id}/dependentes                -> DependentesDoTitular
 *   - POST /chefe/beneficiarios/{id}/dependentes                -> DependenteItem (T31-BE2)
 *   - GET  /chefe/beneficiarios/{id}/dependentes/proximo-prec-cp -> { precCp }
 *   - GET  /chefe/beneficiarios/{id}/dependentes/conta?cpf=      -> ContaPorCpf (T31-BE2)
 *   - PUT  /chefe/dependentes/{id}                              -> DependenteItem (T31-BE3)
 */

export type TipoDependente = 'MENOR_TITULAR' | 'MENOR_RESPONSAVEL' | 'MAIOR'

/** Quem age pelo menor: o titular ou um responsável legal externo (um só por menor, regra 13). */
export interface ResponsavelDependente {
  usuarioId: number
  nome: string
  papel: 'TITULAR' | 'EXTERNO'
}

export interface DependenteItem {
  dependenteId: number
  nome: string
  vinculo: string | null
  precCp: string
  cpf?: string
  telefone?: string | null
  dataNascimento: string
  idade: number
  tipo: TipoDependente
  /** null = vitalícia. */
  vigenciaFim: string | null
  vigenciaVencida: boolean
  temConta: boolean
  responsaveis: ResponsavelDependente[]
}

export interface DependentesDoTitular {
  titularId: number
  titularNome: string
  dependentes: DependenteItem[]
}

export interface ResponsavelPedido {
  tipo: 'TITULAR' | 'OUTRA_PESSOA'
  cpf?: string
  nome?: string
  telefone?: string
}

export interface CriarDependentePedido {
  nome: string
  dataNascimento: string
  cpf: string
  telefone: string
  precCp: string
  vinculo: string
  tipoVigencia: 'VITALICIA' | 'DETERMINADA'
  vigenciaFim: string | null
  responsavel: ResponsavelPedido | null
  senha: string | null
}

export interface EditarDependentePedido {
  nome: string
  telefone: string
  precCp: string
  vinculo: string
  tipoVigencia: 'VITALICIA' | 'DETERMINADA'
  vigenciaFim: string | null
}

/** Conta já existente para o CPF (T31-BE2): o que o formulário avisa antes de salvar. */
export interface ContaPorCpf {
  situacao: 'NOVA' | 'RESPONSAVEL_EXTERNO' | 'DEPENDENTE_MAIOR_VITALICIO' | 'OUTRA'
  nome: string | null
}

export interface ChefeDependentesApi {
  listar(titularId: number): Promise<DependentesDoTitular>
  criar(titularId: number, pedido: CriarDependentePedido): Promise<DependenteItem>
  editar(dependenteId: number, pedido: EditarDependentePedido): Promise<DependenteItem>
  proximoPrecCp(titularId: number): Promise<{ precCp: string }>
  consultarConta(titularId: number, cpf: string): Promise<ContaPorCpf>
}
