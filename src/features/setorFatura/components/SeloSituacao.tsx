import { classeSeloSituacao, rotuloSituacao } from '../formatadores'
import type { SituacaoFatura } from '../types'

interface Props {
  situacao: SituacaoFatura
}

/** Selo colorido da situação do espelho/fatura (amarelo, azul, roxo, azul claro, laranja). */
export default function SeloSituacao({ situacao }: Props) {
  return <span className={`sf-selo ${classeSeloSituacao(situacao)}`}>{rotuloSituacao(situacao)}</span>
}
