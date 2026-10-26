/**
 * T0-FE: perfis, rotulos, pagina inicial e menu lateral de cada perfil.
 *
 * O login fica em shared/auth (tela /login e RotaProtegida): cada area so abre para o perfil dono dela.
 */
export type Perfil = 'BENEFICIARIO' | 'MEDICO' | 'CHEFE_FUSEX' | 'SETOR_GUIAS' | 'RECEPCAO'

export interface ItemMenu {
  to: string
  label: string
}

export const CHAVE_LOGIN = 'X-Usuario-Login'
export const CHAVE_PERFIL = 'nexus-perfil-simulado'

/** Contas do seed (R__dados_exemplo.sql). */
export const LOGIN_PADRAO: Record<Perfil, string> = {
  BENEFICIARIO: '52998224725',
  MEDICO: '11144477735',
  CHEFE_FUSEX: 'chefe.fusex',
  SETOR_GUIAS: 'setor.guias',
  RECEPCAO: 'recepcao',
}

/** Nome do perfil na barra superior. */
export const ROTULO_PERFIL: Record<Perfil, string> = {
  BENEFICIARIO: 'Beneficiário',
  MEDICO: 'Médico FUSEX',
  CHEFE_FUSEX: 'Chefe do FUSEX',
  SETOR_GUIAS: 'Setor de Guias',
  RECEPCAO: 'Recepção',
}

/** Página inicial de cada perfil. */
export const INICIO_PERFIL: Record<Perfil, string> = {
  BENEFICIARIO: '/beneficiario/inicio',
  MEDICO: '/medico/inicio',
  CHEFE_FUSEX: '/chefe/guias-para-assinar',
  SETOR_GUIAS: '/setor-guias/fila',
  RECEPCAO: '/recepcao/guias-para-impressao',
}

/** Menu lateral de cada perfil: mostra so os itens do perfil logado. */
export const MENUS: Record<Perfil, ItemMenu[]> = {
  BENEFICIARIO: [
    { to: '/beneficiario/inicio', label: 'Início' },
    { to: '/pre-guias/nova', label: 'Nova pré-guia' },
    { to: '/pre-guias', label: 'Minhas pré-guias' },
    { to: '/beneficiario/minhas-informacoes', label: 'Minhas informações' },
  ],
  MEDICO: [
    { to: '/medico/inicio', label: 'Início' },
    { to: '/medico/nova-pre-guia', label: 'Nova pré-guia' },
    { to: '/medico/corrigir-pre-guias', label: 'Corrigir pré-guias' },
    { to: '/medico/guias-para-assinar', label: 'Guias para assinar' },
    { to: '/medico/minhas-informacoes', label: 'Minhas informações' },
  ],
  CHEFE_FUSEX: [
    { to: '/chefe/guias-para-assinar', label: 'Guias para assinar' },
    { to: '/chefe/beneficiarios', label: 'Beneficiários' },
    { to: '/chefe/medicos', label: 'Médicos' },
    { to: '/chefe/minhas-informacoes', label: 'Minhas informações' },
  ],
  SETOR_GUIAS: [{ to: '/setor-guias/fila', label: 'Fila de pré-guias' }],
  RECEPCAO: [{ to: '/recepcao/guias-para-impressao', label: 'Guias para impressão' }],
}
