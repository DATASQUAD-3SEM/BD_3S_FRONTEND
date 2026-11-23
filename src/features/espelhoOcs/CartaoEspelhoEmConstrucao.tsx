import { Link } from 'react-router-dom'
import { formatarData } from '../../shared/utils/formatadores'
import { formatarMoeda } from './formatadores'

interface Props {
  id: number
  dataInicio: string | null
  quantidadeGuias: number
  valorTotal: number
}

export default function CartaoEspelhoEmConstrucao({ id, dataInicio, quantidadeGuias, valorTotal }: Props) {
  return (
    <Link to="/ocs/espelho/atual" className="oe-cartao-espelho">
      <div className="oe-cartao-texto">
        <strong>{`Espelho nº ${id} (em construção)`}</strong>
        <span>{`Em construção desde ${formatarData(dataInicio)}`}</span>
      </div>
      <div className="oe-cartao-valores">
        <span>{quantidadeGuias === 1 ? '1 guia' : `${quantidadeGuias} guias`}</span>
        <strong>{formatarMoeda(valorTotal)}</strong>
      </div>
    </Link>
  )
}
