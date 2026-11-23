import { formatarDataCurta, formatarMoeda } from '../formatadores'
import type { EtapaFluxoFatura } from '../types'

interface Props {
  etapas: EtapaFluxoFatura[]
}

/** Etapa em andamento: tem entrada, mas sem saída. Fica destacada, com "Em andamento" na saída. */
function emAndamento(etapa: EtapaFluxoFatura): boolean {
  return etapa.dataEntrada !== null && etapa.dataSaida === null
}

/**
 * Controle de fluxo da fatura (capa do SISFAT): uma linha por etapa (Protocolo, Lisura / Glosa, Glosa / OCS,
 * Auditagem e Arquivo), com setor, datas, responsável e valores. A linha Glosa / OCS só vem quando a fatura
 * teve glosa (o backend já a omite quando não houve). A etapa em andamento fica destacada.
 */
export default function ControleFluxoFatura({ etapas }: Props) {
  if (etapas.length === 0) return null
  return (
    <div className="sf-fluxo">
      <h4>Controle de fluxo da fatura</h4>
      <div className="sf-tabela-overflow">
        <table className="sf-tabela sf-tabela--fluxo">
          <thead>
          <tr>
            <th scope="col">Etapa</th>
            <th scope="col">Setor</th>
            <th scope="col">Entrada</th>
            <th scope="col">Saída</th>
            <th scope="col">Responsável</th>
            <th scope="col">Valor inicial</th>
            <th scope="col">Valor final</th>
          </tr>
          </thead>
          <tbody>
          {etapas.map((etapa, indice) => {
            const andamento = emAndamento(etapa)
            return (
              <tr key={`${etapa.etapa}-${indice}`} className={andamento ? 'sf-fluxo--andamento' : undefined}>
                <th scope="row">{etapa.etapa}</th>
                <td>{etapa.setor}</td>
                <td>{formatarDataCurta(etapa.dataEntrada)}</td>
                <td>{andamento ? 'Em andamento' : formatarDataCurta(etapa.dataSaida)}</td>
                <td>{etapa.responsavel ?? '—'}</td>
                <td>{formatarMoeda(etapa.valorInicial)}</td>
                <td>{formatarMoeda(etapa.valorFinal)}</td>
              </tr>
            )
          })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
