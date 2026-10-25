import LayoutPerfil from '../../shared/layout/LayoutPerfil'
import { garantirPerfilSimulado } from '../../shared/layout/perfis'

/** Área do Setor de Guias (T0-FE): só "Fila de pré-guias" no menu. */
export default function SetorGuiasLayout() {
  garantirPerfilSimulado('SETOR_GUIAS')
  return <LayoutPerfil perfil="SETOR_GUIAS" />
}
