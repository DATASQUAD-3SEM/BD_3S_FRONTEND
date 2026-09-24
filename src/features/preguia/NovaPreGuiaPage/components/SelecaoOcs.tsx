import EmConstrucao from '../../../../shared/components/EmConstrucao'

interface Props {
  value: number | null
  onChange: (ocsId: number | null) => void
}

/** SCRUM 35 - escolher a OCS (usa listarOcs de features/ocs/api.ts). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function SelecaoOcs(_props: Props) {
  return <EmConstrucao nome="SelecaoOcs" task="SCRUM 35" />
}
