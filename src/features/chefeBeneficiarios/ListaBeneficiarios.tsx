import type { BeneficiarioItem, SituacaoFiltro } from './tipos'
import { mascaraCpf, mascaraPrecCp } from '../../shared/utils/formatadores'

export const TAMANHO_PAGINA = 10

export type EstadoLista = 'carregando' | 'pronto' | 'erro'

interface Props {
  busca: string
  onBusca: (valor: string) => void
  situacao: SituacaoFiltro
  onSituacao: (valor: SituacaoFiltro) => void
  estado: EstadoLista
  itens: BeneficiarioItem[]
  total: number
  pagina: number
  onPagina: (pagina: number) => void
  editandoId: number | null
  onEditar: (id: number) => void
  onAlternar: (item: BeneficiarioItem) => void
  onTentarNovamente: () => void
}

export default function ListaBeneficiarios({
                                             busca,
                                             onBusca,
                                             situacao,
                                             onSituacao,
                                             estado,
                                             itens,
                                             total,
                                             pagina,
                                             onPagina,
                                             editandoId,
                                             onEditar,
                                             onAlternar,
                                             onTentarNovamente,
                                           }: Props) {
  const totalPaginas = Math.max(1, Math.ceil(total / TAMANHO_PAGINA))

  return (
    <section className="benef-painel" aria-label="Lista de beneficiários">
      <div className="benef-filtros">
        <input
          type="search"
          className="benef-campo benef-busca"
          aria-label="Buscar por nome, CPF ou Prec CP"
          placeholder="Buscar por nome, CPF ou Prec CP"
          value={busca}
          onChange={(e) => onBusca(e.target.value)}
        />
        <select
          className="benef-campo benef-select"
          aria-label="Filtrar por situação"
          value={situacao}
          onChange={(e) => onSituacao(e.target.value as SituacaoFiltro)}
        >
          <option value="ativos">Ativos</option>
          <option value="inativos">Inativos</option>
          <option value="todos">Todos</option>
        </select>
      </div>

      {estado === 'carregando' && (
        <div className="benef-skeleton" aria-busy="true" aria-label="Carregando beneficiários">
          {[1, 2, 3].map((n) => (
            <div key={n} className="benef-skeleton-linha" />
          ))}
        </div>
      )}

      {estado === 'erro' && (
        <div role="alert" className="benef-estado">
          <p>Não foi possível carregar os beneficiários.</p>
          <button type="button" className="benef-btn benef-btn--primario" onClick={onTentarNovamente}>
            Tentar novamente
          </button>
        </div>
      )}

      {estado === 'pronto' && itens.length === 0 && (
        <p className="benef-estado">Nenhum beneficiário encontrado.</p>
      )}

      {estado === 'pronto' && itens.length > 0 && (
        <div className="benef-tabela-wrapper">
          <table className="benef-tabela">
            <thead>
            <tr>
              <th>Nome</th>
              <th>CPF (login)</th>
              <th>Prec CP</th>
              <th>Situação</th>
              <th>
                <span className="benef-sr-only">Ações</span>
              </th>
            </tr>
            </thead>
            <tbody>
            {itens.map((item) => (
              <tr key={item.id} className={item.id === editandoId ? 'benef-linha-editando' : undefined}>
                <td>{item.nome}</td>
                <td>{mascaraCpf(item.cpf)}</td>
                <td>{mascaraPrecCp(item.precCp)}</td>
                <td>
                    <span className={`benef-badge ${item.ativo ? 'benef-badge--ativo' : 'benef-badge--inativo'}`}>
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td className="benef-acoes">
                  <button type="button" className="benef-btn" onClick={() => onEditar(item.id)}>
                    Editar
                  </button>
                  {item.ativo ? (
                    <button type="button" className="benef-btn" onClick={() => onAlternar(item)}>
                      Desativar
                    </button>
                  ) : (
                    <button type="button" className="benef-btn benef-btn--primario" onClick={() => onAlternar(item)}>
                      Reativar
                    </button>
                  )}
                </td>
              </tr>
            ))}
            </tbody>
          </table>
        </div>
      )}

      <p className="benef-nota">Desativar bloqueia o acesso, mas mantém o histórico de pré-guias e Guias.</p>

      {estado === 'pronto' && totalPaginas > 1 && (
        <nav className="benef-paginacao" aria-label="Paginação">
          <button type="button" className="benef-btn" disabled={pagina === 0} onClick={() => onPagina(pagina - 1)}>
            Anterior
          </button>
          <span>
            Página {pagina + 1} de {totalPaginas} · {total} beneficiários
          </span>
          <button
            type="button"
            className="benef-btn"
            disabled={pagina + 1 >= totalPaginas}
            onClick={() => onPagina(pagina + 1)}
          >
            Próxima
          </button>
        </nav>
      )}
    </section>
  )
}
