import LayoutPerfil from '../../shared/layout/LayoutPerfil'
import { garantirPerfilSimulado } from '../../shared/layout/perfis'
import './guiasRecepcao.css'

export default function RecepcaoLayout() {
  garantirPerfilSimulado('RECEPCAO')
  return <LayoutPerfil perfil="RECEPCAO" />
}
