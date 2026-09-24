import EmConstrucao from '../../../../shared/components/EmConstrucao'
import type { NovaPreGuiaForm } from '../types'

interface Props {
  form: NovaPreGuiaForm
}

/** SCRUM 38 - resumo para conferir tudo antes de enviar. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function RevisaoResumo(_props: Props) {
  return <EmConstrucao nome="RevisaoResumo" task="SCRUM 38" />
}
