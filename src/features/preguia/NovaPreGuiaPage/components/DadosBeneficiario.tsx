import EmConstrucao from '../../../../shared/components/EmConstrucao'
import type { DadosBeneficiarioForm } from '../types'

interface Props {
  value: DadosBeneficiarioForm
  onChange: (valor: DadosBeneficiarioForm) => void
}

/** Nome, idade, Prec-CP, CPF e telefone do beneficiario (manual.txt, item 3.1). */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function DadosBeneficiario(_props: Props) {
  return <EmConstrucao nome="DadosBeneficiario" task="componente de dados" />
}
