import LayoutPerfil from '../../shared/layout/LayoutPerfil'
import { garantirPerfilSimulado } from '../../shared/layout/perfis'
import { ChefeProvider } from './ChefeContext'
import './chefeLayout.css'

export default function ChefeLayout() {
  garantirPerfilSimulado('CHEFE_FUSEX')
  return (
    <ChefeProvider>
      <LayoutPerfil perfil="CHEFE_FUSEX" />
    </ChefeProvider>
  )
}
