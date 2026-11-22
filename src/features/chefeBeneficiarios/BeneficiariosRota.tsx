import { useNavigate } from 'react-router-dom'
import BeneficiariosPage from './BeneficiariosPage'

/** Liga o botão "Dependentes" da lista do chefe à tela de dependentes do titular (T31-FE1 / T31-FE2). */
export default function BeneficiariosRota() {
  const navigate = useNavigate()
  return <BeneficiariosPage onDependentes={(id) => navigate(`/chefe/beneficiarios/${id}/dependentes`)} />
}
