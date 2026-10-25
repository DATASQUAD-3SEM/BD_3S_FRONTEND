import LayoutPerfil from '../../shared/layout/LayoutPerfil'
import { garantirPerfilSimulado } from '../../shared/layout/perfis'
import { ChefeProvider } from './ChefeContext'
import './chefeLayout.css'

/**
 * Layout do perfil Chefe do FUSEX (T0-FE): garante o login simulado do chefe e monta o menu do perfil.
 */

export default function ChefeLayout() {
  garantirPerfilSimulado('CHEFE_FUSEX')
  return (
    <ChefeProvider>
      <LayoutPerfil perfil="CHEFE_FUSEX" />
    </ChefeProvider>
  )
}
