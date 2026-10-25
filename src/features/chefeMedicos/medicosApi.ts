import { get, patch, post, put } from '../../shared/api/http'
import { medicosMock } from './medicosApi.mock'
import type { DadosCadastro, DadosEdicao, ListaMedicos, MedicoDetalhe, MedicosApi, ParamsListar } from './tipos'

/** true = usa o mock em memória (sem backend). Deixe false para falar com o backend real. */
const USAR_MOCK = false

const BASE = '/chefe/medicos'

const medicosReal: MedicosApi = {
  listar({ busca, situacao, page, size }: ParamsListar) {
    const query = new URLSearchParams({ busca, situacao, page: String(page), size: String(size) })
    return get<ListaMedicos>(`${BASE}?${query.toString()}`)
  },
  cadastrar(dados: DadosCadastro) {
    return post<{ id: number }>(BASE, dados)
  },
  buscar(id: number) {
    return get<MedicoDetalhe>(`${BASE}/${id}`)
  },
  editar(id: number, dados: DadosEdicao) {
    return put<MedicoDetalhe>(`${BASE}/${id}`, dados)
  },
  alterarSituacao(id: number, ativo: boolean) {
    return patch<{ id: number; ativo: boolean }>(`${BASE}/${id}/situacao`, { ativo })
  },
}

export const medicosApi: MedicosApi = USAR_MOCK ? medicosMock : medicosReal
