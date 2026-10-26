import LayoutPerfil from '../../shared/layout/LayoutPerfil'

/**
 * Área do Setor de Guias (T0-FE): só "Fila de pré-guias" no menu.
 * O item fica destacado também na tela de detalhe (itemAtivo), pois o menu tem um único item.
 */
export default function SetorGuiasLayout() {
  return <LayoutPerfil perfil="SETOR_GUIAS" itemAtivo="/setor-guias/fila" />
}
