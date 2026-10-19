import type { FiltroSituacao } from '../types.ts'

interface Props {
  busca: string
  onBusca: (busca: string) => void
  situacao: FiltroSituacao
  onSituacao: (situacao: FiltroSituacao) => void
}

export default function FiltroMedicos({ busca, onBusca, situacao, onSituacao }: Props) {
  return (
    <div className="barra-filtros">
      <input
        type="search"
        aria-label="Buscar médico"
        placeholder="Buscar por nome, CPF, Prec CP ou CRM"
        value={busca}
        onChange={(e) => onBusca(e.target.value)}
      />
      <select
        aria-label="Filtrar por situação"
        value={situacao}
        onChange={(e) => onSituacao(e.target.value as FiltroSituacao)}
      >
        <option value="todos">Todos</option>
        <option value="ativos">Ativos</option>
        <option value="inativos">Inativos</option>
      </select>
    </div>
  )
}
