import EmConstrucao from '../../../../shared/components/EmConstrucao'

interface Props {
  /** Procedimentos disponiveis dependem da OCS escolhida. */
  ocsId: number | null
  value: number[]
  onChange: (procedimentoIds: number[]) => void
}

/** SCRUM 36 - escolher os exames (usa listarProcedimentosDaOcs). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function SelecaoProcedimentos(_props: Props) {
  return <EmConstrucao nome="SelecaoProcedimentos" task="SCRUM 36" />
}
