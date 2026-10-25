/**
 * T0-FE: perfis, menus e login simulado.
 *
 * Ainda nao ha tela de login: o backend identifica o usuario pelo header X-Usuario-Login
 * (ver shared/api/http.ts). Cada area de perfil garante que o login simulado seja de uma
 * conta daquele perfil (as contas do seed), para as telas nao receberem 403.
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

function lerStorage(chave: string): string | null {
  try {
    return localStorage.getItem(chave)
  } catch {
    return null
  }
}

/**
 * Garante que o login simulado pertence ao perfil da area aberta.
 * Se o perfil guardado ja e este, nao mexe: assim o chefe que trocou o proprio login (T12) continua logado.
 */
export function garantirPerfilSimulado(perfil: Perfil): void {
  try {
    if (lerStorage(CHAVE_PERFIL) === perfil && lerStorage(CHAVE_LOGIN)) return
    localStorage.setItem(CHAVE_PERFIL, perfil)
    localStorage.setItem(CHAVE_LOGIN, LOGIN_PADRAO[perfil])
  } catch {
    // sem localStorage (ex.: modo privado): o http.ts usa o login padrao
  }
}

/** Entrar como outro perfil a partir do Início geral. */
export function entrarComo(perfil: Perfil): void {
  try {
    localStorage.setItem(CHAVE_PERFIL, perfil)
    localStorage.setItem(CHAVE_LOGIN, LOGIN_PADRAO[perfil])
  } catch {
    // ignora: sem localStorage o http.ts usa o login padrao
  }
}
