import { formatarMoeda } from '../formatadores'
import type { LinhaEspelho } from '../types'

interface Props {
  linhas: LinhaEspelho[]
}

/** Soma dos valores das linhas (valor informado); bate com o valor total do cartão. */
function valorTotalDasLinhas(linhas: LinhaEspelho[]): number {
  return Number(linhas.reduce((acc, l) => acc + l.valorTotal, 0).toFixed(2))
}

/** Tabela só de leitura das guias do espelho (Guia nº, Paciente, Código, Procedimento, Qtd., Valor/sessão, Valor). */
export default function TabelaGuiasEspelho({ linhas }: Props) {
  const total = valorTotalDasLinhas(linhas)
  return (
    <div className="sf-tabela-overflow">
      <table className="sf-tabela">
        <thead>
        <tr>
          <th scope="col">Guia nº</th>
          <th scope="col">Paciente</th>
          <th scope="col">Código</th>
          <th scope="col">Procedimento</th>
          <th scope="col">Qtd. sessões</th>
          <th scope="col">Valor por sessão (R)</th>
          <th scope="col">Valor (R)</th>
        </tr>
        </thead>
        <tbody>
        {linhas.map((linha) => (
          <tr key={linha.itemId}>
            <td>{linha.guiaNumero}</td>
            <td>{linha.paciente}</td>
            <td>{linha.codigo}</td>
            <td>{linha.procedimento}</td>
            <td>{linha.quantidadeSessoes}</td>
            <td>{formatarMoeda(linha.valorSessao)}</td>
            <td>{formatarMoeda(linha.valorTotal)}</td>
          </tr>
        ))}
        </tbody>
        <tfoot>
        <tr className="sf-tabela-total">
          <th scope="row" colSpan={6}>
            VALOR TOTAL
          </th>
          <td>{formatarMoeda(total)}</td>
        </tr>
        </tfoot>
      </table>
    </div>
  )
}
