import { useNavigate, useParams } from 'react-router-dom'
import DependenteFormPage from './DependenteFormPage'

/** Rotas de adicionar e editar dependente do chefe (T31-FE3); ao salvar ou cancelar, volta aos dependentes. */
export default function DependenteFormRota() {
  const { id, dependenteId } = useParams()
  const titularId = Number(id)
  const navigate = useNavigate()
  const voltar = () => navigate(`/chefe/beneficiarios/${titularId}/dependentes`)
  return (
    <DependenteFormPage
      key={dependenteId ?? 'novo'}
      titularId={titularId}
      dependenteId={dependenteId ? Number(dependenteId) : undefined}
      onConcluido={voltar}
      onVoltar={voltar}
    />
  )
}
