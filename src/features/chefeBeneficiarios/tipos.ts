export type SituacaoFiltro = 'ativos' | 'inativos' | 'todos'

export interface BeneficiarioItem {
  id: number
  nome: string
  cpf: string
  precCp: string
  ativo: boolean
}

export interface ListaBeneficiarios {
  total: number
  pagina: number
  tamanho: number
  itens: BeneficiarioItem[]
}

export interface ParamsListar {
  busca: string
  situacao: SituacaoFiltro
  page: number
  size: number
}

export interface BeneficiarioDetalhe extends BeneficiarioItem {
  dataNascimento: string
  telefone: string
  faixaEtaria: string
  idade: number
}

/** Corpo do POST /chefe/beneficiarios (T7-BE2). */
export interface DadosCadastro {
  nome: string
  cpf: string
  precCp: string
  dataNascimento: string
  telefone: string
  senha: string
}

/** Corpo do PUT /chefe/beneficiarios/{id} (T7-BE3). */
export interface DadosEdicao {
  nome: string
  cpf: string
  precCp: string
  dataNascimento: string
  telefone: string
  ativo: boolean
  novaSenha: string
}

export interface BeneficiariosApi {
  listar(params: ParamsListar): Promise<ListaBeneficiarios>
  cadastrar(dados: DadosCadastro): Promise<{ id: number }>
  buscar(id: number): Promise<BeneficiarioDetalhe>
  editar(id: number, dados: DadosEdicao): Promise<BeneficiarioDetalhe>
  alterarSituacao(id: number, ativo: boolean): Promise<{ id: number; ativo: boolean }>
}
