import { useNavigate, useParams } from 'react-router-dom'
import DependentesTitularPage from './DependentesTitularPage'

/** Liga a tela de dependentes do titular às rotas do chefe (T31-FE2): voltar, adicionar e editar. */
export default function DependentesTitularRota() {
  const { id } = useParams()
  const titularId = Number(id)
  const navigate = useNavigate()
  return (
    <DependentesTitularPage
      titularId={titularId}
      onVoltar={() => navigate('/chefe/beneficiarios')}
      onAdicionar={() => navigate(`/chefe/beneficiarios/${titularId}/dependentes/novo`)}
      onEditar={(dependenteId) => navigate(`/chefe/beneficiarios/${titularId}/dependentes/${dependenteId}/editar`)}
    />
  )
}
