import LayoutPerfil from '../../shared/layout/LayoutPerfil'
import { garantirPerfilSimulado } from '../../shared/layout/perfis'

/**
 * Área do Setor de Guias (T0-FE): só "Fila de pré-guias" no menu.
 * O item fica destacado também na tela de detalhe (itemAtivo), pois o menu tem um único item.
 */
export default function SetorGuiasLayout() {
  garantirPerfilSimulado('SETOR_GUIAS')
  return <LayoutPerfil perfil="SETOR_GUIAS" itemAtivo="/setor-guias/fila" />
}
