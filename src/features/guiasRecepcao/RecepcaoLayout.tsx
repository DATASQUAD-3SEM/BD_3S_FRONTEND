import LayoutPerfil from '../../shared/layout/LayoutPerfil'
import { garantirPerfilSimulado } from '../../shared/layout/perfis'
import './guiasRecepcao.css'

/**
 * Layout do perfil Recepcao (T0-FE): garante o login simulado da recepcao e monta o menu do perfil.
 */

export default function RecepcaoLayout() {
  garantirPerfilSimulado('RECEPCAO')
  return <LayoutPerfil perfil="RECEPCAO" />
}
