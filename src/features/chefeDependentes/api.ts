import { get, post, put } from '../../shared/api/http'
import type {
  ChefeDependentesApi,
  ContaPorCpf,
  CriarDependentePedido,
  DependenteItem,
  DependentesDoTitular,
  EditarDependentePedido,
} from './tipos'

const base = (titularId: number) => `/chefe/beneficiarios/${titularId}/dependentes`

export const chefeDependentesApi: ChefeDependentesApi = {
  listar: (titularId) => get<DependentesDoTitular>(base(titularId)),
  criar: (titularId, pedido: CriarDependentePedido) => post<DependenteItem>(base(titularId), pedido),
  editar: (dependenteId, pedido: EditarDependentePedido) => put<DependenteItem>(`/chefe/dependentes/${dependenteId}`, pedido),
  proximoPrecCp: (titularId) => get<{ precCp: string }>(`${base(titularId)}/proximo-prec-cp`),
  consultarConta: (titularId, cpf) =>
    get<ContaPorCpf>(`${base(titularId)}/conta?${new URLSearchParams({ cpf }).toString()}`),
}
