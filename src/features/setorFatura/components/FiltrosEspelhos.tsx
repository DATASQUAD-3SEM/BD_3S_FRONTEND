import { ROTULO_SITUACAO } from '../formatadores'
import type { SituacaoFatura } from '../types'

interface Props {
  /** OCS selecionada; '' = Todas as OCS. */
  ocsSelecionada: string
  /** Situação selecionada; '' = Todas. */
  situacaoSelecionada: string
  /** OCS distintas presentes na lista (para o seletor). */
  ocsDisponiveis: string[]
  onOcsChange: (ocs: string) => void
  onSituacaoChange: (situacao: string) => void
}

/** Situações oferecidas no filtro (sem Auditada, que tem aba própria). */
const SITUACOES_FILTRO: SituacaoFatura[] = [
  'RECEBIDO',
  'PROTOCOLADA',
  'EM_LISURA',
  'AGUARDANDO_OCS',
  'EM_AUDITORIA',
]

/** Filtros "OCS" e "Situação" acima da lista. São feitos na tela, sobre a lista já carregada. */
export default function FiltrosEspelhos({
                                          ocsSelecionada,
                                          situacaoSelecionada,
                                          ocsDisponiveis,
                                          onOcsChange,
                                          onSituacaoChange,
                                        }: Props) {
  return (
    <div className="sf-filtros">
      <div className="sf-filtro">
        <label htmlFor="sf-filtro-ocs">OCS</label>
        <select
          id="sf-filtro-ocs"
          className="sf-select"
          value={ocsSelecionada}
          onChange={(e) => onOcsChange(e.target.value)}
        >
          <option value="">Todas as OCS</option>
          {ocsDisponiveis.map((ocs) => (
            <option key={ocs} value={ocs}>
              {ocs}
            </option>
          ))}
        </select>
      </div>

      <div className="sf-filtro">
        <label htmlFor="sf-filtro-situacao">Situação</label>
        <select
          id="sf-filtro-situacao"
          className="sf-select"
          value={situacaoSelecionada}
          onChange={(e) => onSituacaoChange(e.target.value)}
        >
          <option value="">Todas</option>
          {SITUACOES_FILTRO.map((s) => (
            <option key={s} value={s}>
              {ROTULO_SITUACAO[s]}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}
