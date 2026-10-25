export type SituacaoFiltro = 'ativos' | 'inativos' | 'todos'

/** Linha da tabela do chefe (GET /chefe/medicos, T8-BE1). CPF e Prec CP vêm sem máscara. */
export interface MedicoItem {
  id: number
  nome: string
  cpf: string
  precCp: string
  crm: string
  ativo: boolean
}

export interface ListaMedicos {
  total: number
  pagina: number
  tamanho: number
  itens: MedicoItem[]
}

export interface ParamsListar {
  busca: string
  situacao: SituacaoFiltro
  page: number
  size: number
}

/** Detalhe usado no modo de edição (GET /chefe/medicos/{id}, T8-BE3). */
export interface MedicoDetalhe extends MedicoItem {
  patente: string
}

/** Corpo do POST /chefe/medicos (T8-BE2). */
export interface DadosCadastro {
  nome: string
  patente: string
  cpf: string
  precCp: string
  crm: string
  senha: string
}

/** Corpo do PUT /chefe/medicos/{id} (T8-BE3). */
export interface DadosEdicao {
  nome: string
  patente: string
  cpf: string
  precCp: string
  crm: string
  ativo: boolean
  novaSenha: string
}

export interface MedicosApi {
  listar(params: ParamsListar): Promise<ListaMedicos>
  cadastrar(dados: DadosCadastro): Promise<{ id: number }>
  buscar(id: number): Promise<MedicoDetalhe>
  editar(id: number, dados: DadosEdicao): Promise<MedicoDetalhe>
  alterarSituacao(id: number, ativo: boolean): Promise<{ id: number; ativo: boolean }>
}
