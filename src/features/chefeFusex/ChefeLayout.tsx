import LayoutPerfil from '../../shared/layout/LayoutPerfil'
import { ChefeProvider } from './ChefeContext'
import './chefeLayout.css'

/**
 * Layout do perfil Chefe do FUSEX (T0-FE): monta o menu do perfil.
 */

export default function ChefeLayout() {
  return (
    <ChefeProvider>
      <LayoutPerfil perfil="CHEFE_FUSEX" />
    </ChefeProvider>
  )
}
