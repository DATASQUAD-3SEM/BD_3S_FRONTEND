import type { MedicoItem, SituacaoFiltro } from './tipos'
import { mascaraCrm } from './validacaoMedico'
import { mascaraCpf, mascaraPrecCp } from '../../shared/utils/formatadores'

/**
 * Tabela de medicos do Chefe, com as acoes Editar, Desativar e Reativar (ambas com confirmacao).
 */

export const TAMANHO_PAGINA = 10

export type EstadoLista = 'carregando' | 'pronto' | 'erro'

interface Props {
  busca: string
  onBusca: (valor: string) => void
  situacao: SituacaoFiltro
  onSituacao: (valor: SituacaoFiltro) => void
  estado: EstadoLista
  itens: MedicoItem[]
  total: number
  pagina: number
  onPagina: (pagina: number) => void
  editandoId: number | null
  onEditar: (id: number) => void
  onAlternar: (item: MedicoItem) => void
  onTentarNovamente: () => void
}

export default function ListaMedicos({
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
    <section className="med-painel" aria-label="Lista de médicos">
      <div className="med-filtros">
        <input
          type="search"
          className="med-campo med-busca"
          aria-label="Buscar por nome, CPF, Prec CP ou CRM"
          placeholder="Buscar por nome, CPF, Prec CP ou CRM"
          value={busca}
          onChange={(e) => onBusca(e.target.value)}
        />
        <select
          className="med-campo med-select"
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
        <div className="med-skeleton" aria-busy="true" aria-label="Carregando médicos">
          {[1, 2, 3].map((n) => (
            <div key={n} className="med-skeleton-linha" />
          ))}
        </div>
      )}

      {estado === 'erro' && (
        <div role="alert" className="med-estado">
          <p>Não foi possível carregar os médicos.</p>
          <button type="button" className="med-btn med-btn--primario" onClick={onTentarNovamente}>
            Tentar novamente
          </button>
        </div>
      )}

      {estado === 'pronto' && itens.length === 0 && (
        <p className="med-estado">Nenhum médico encontrado.</p>
      )}

      {estado === 'pronto' && itens.length > 0 && (
        <div className="med-tabela-wrapper">
          <table className="med-tabela">
            <thead>
            <tr>
              <th>Nome</th>
              <th>CPF (login)</th>
              <th>Prec CP</th>
              <th>CRM</th>
              <th>Situação</th>
              <th>
                <span className="med-sr-only">Ações</span>
              </th>
            </tr>
            </thead>
            <tbody>
            {itens.map((item) => (
              <tr key={item.id} className={item.id === editandoId ? 'med-linha-editando' : undefined}>
                <td>{item.nome}</td>
                <td>{mascaraCpf(item.cpf)}</td>
                <td>{mascaraPrecCp(item.precCp)}</td>
                <td>{mascaraCrm(item.crm)}</td>
                <td>
                    <span className={`med-badge ${item.ativo ? 'med-badge--ativo' : 'med-badge--inativo'}`}>
                      {item.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td className="med-acoes">
                  <button type="button" className="med-btn" onClick={() => onEditar(item.id)}>
                    Editar
                  </button>
                  {item.ativo ? (
                    <button type="button" className="med-btn" onClick={() => onAlternar(item)}>
                      Desativar
                    </button>
                  ) : (
                    <button type="button" className="med-btn med-btn--primario" onClick={() => onAlternar(item)}>
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

      <p className="med-nota">Desativar bloqueia o acesso e a assinatura, mas mantém o histórico.</p>

      {estado === 'pronto' && totalPaginas > 1 && (
        <nav className="med-paginacao" aria-label="Paginação">
          <button type="button" className="med-btn" disabled={pagina === 0} onClick={() => onPagina(pagina - 1)}>
            Anterior
          </button>
          <span>
            Página {pagina + 1} de {totalPaginas} · {total} médicos
          </span>
          <button
            type="button"
            className="med-btn"
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
