import { get, patch, post, put } from '../../shared/api/http'
import { beneficiariosMock } from './beneficiariosApi.mock'
import type {
  BeneficiarioDetalhe,
  BeneficiariosApi,
  DadosCadastro,
  DadosEdicao,
  ListaBeneficiarios,
  ParamsListar,
} from './tipos'

/** true = usa o mock em memória (sem backend). Deixe false para falar com o backend real. */
const USAR_MOCK = false

const BASE = '/chefe/beneficiarios'

const beneficiariosReal: BeneficiariosApi = {
  listar({ busca, situacao, page, size }: ParamsListar) {
    const query = new URLSearchParams({
      busca,
      situacao,
      page: String(page),
      size: String(size),
    })
    return get<ListaBeneficiarios>(`${BASE}?${query.toString()}`)
  },
  cadastrar(dados: DadosCadastro) {
    return post<{ id: number }>(BASE, dados)
  },
  buscar(id: number) {
    return get<BeneficiarioDetalhe>(`${BASE}/${id}`)
  },
  editar(id: number, dados: DadosEdicao) {
    return put<BeneficiarioDetalhe>(`${BASE}/${id}`, dados)
  },
  alterarSituacao(id: number, ativo: boolean) {
    return patch<{ id: number; ativo: boolean }>(`${BASE}/${id}/situacao`, { ativo })
  },
}

export const beneficiariosApi: BeneficiariosApi = USAR_MOCK ? beneficiariosMock : beneficiariosReal
