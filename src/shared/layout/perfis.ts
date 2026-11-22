/**
 * T0-FE: perfis, rotulos, pagina inicial e menu lateral de cada perfil.
 *
 * O login fica em shared/auth (tela /login e RotaProtegida): cada area so abre para o perfil dono dela.
 */
export type Perfil = 'BENEFICIARIO' | 'MEDICO' | 'CHEFE_FUSEX' | 'SETOR_GUIAS' | 'SETOR_FATURA' | 'RASTREABILIDADE' | 'AUDITORIA' | 'RECEPCAO' | 'OCS' | 'RESPONSAVEL_EXTERNO'

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
  SETOR_FATURA: 'setor.fatura',
  RASTREABILIDADE: 'rastreabilidade',
  AUDITORIA: 'auditoria',
  RECEPCAO: 'recepcao',
  OCS: 'ocs.laboratorio',
  RESPONSAVEL_EXTERNO: '',
}

/** Nome do perfil na barra superior. */
export const ROTULO_PERFIL: Record<Perfil, string> = {
  BENEFICIARIO: 'Beneficiário',
  MEDICO: 'Médico FUSEX',
  CHEFE_FUSEX: 'Chefe do FUSEX',
  SETOR_GUIAS: 'Setor de Guias',
  SETOR_FATURA: 'Setor de Faturas',
  RASTREABILIDADE: 'Rastreabilidade',
  AUDITORIA: 'Auditoria',
  RECEPCAO: 'Recepção',
  OCS: 'OCS',
  RESPONSAVEL_EXTERNO: 'Responsável legal',
}

/** Página inicial de cada perfil. */
export const INICIO_PERFIL: Record<Perfil, string> = {
  BENEFICIARIO: '/beneficiario/inicio',
  MEDICO: '/medico/inicio',
  CHEFE_FUSEX: '/chefe/guias-para-assinar',
  SETOR_GUIAS: '/setor-guias/fila',
  SETOR_FATURA: '/setor-fatura/espelhos-recebidos',
  RASTREABILIDADE: '/rastreabilidade/faturas-recebidas',
  AUDITORIA: '/auditoria/faturas-recebidas',
  RECEPCAO: '/recepcao/guias-para-impressao',
  OCS: '/ocs/espelho',
  RESPONSAVEL_EXTERNO: '/beneficiario/inicio',
}

/** Menu lateral de cada perfil: mostra so os itens do perfil logado. */
export const MENUS: Record<Perfil, ItemMenu[]> = {
  BENEFICIARIO: [
    { to: '/beneficiario/inicio', label: 'Início' },
    { to: '/pre-guias/nova', label: 'Nova pré-guia' },
    { to: '/pre-guias', label: 'Minhas pré-guias' },
    { to: '/guias', label: 'Minhas guias' },
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
  SETOR_FATURA: [
    { to: '/setor-fatura/espelhos-recebidos', label: 'Espelhos recebidos' },
    { to: '/setor-fatura/faturas-auditadas', label: 'Faturas Auditadas' },
  ],
  RASTREABILIDADE: [{ to: '/rastreabilidade/faturas-recebidas', label: 'Faturas Recebidas' }],
  AUDITORIA: [
    { to: '/auditoria/faturas-recebidas', label: 'Faturas Recebidas' },
    { to: '/auditoria/faturas-analisadas', label: 'Faturas Analisadas' },
  ],
  RESPONSAVEL_EXTERNO: [
    { to: '/beneficiario/inicio', label: 'Início' },
    { to: '/pre-guias/nova', label: 'Nova pré-guia' },
    { to: '/pre-guias', label: 'Minhas pré-guias' },
    { to: '/guias', label: 'Minhas guias' },
    { to: '/beneficiario/minhas-informacoes', label: 'Minhas informações' },
  ],
  RECEPCAO: [{ to: '/recepcao/guias-para-impressao', label: 'Guias para impressão' }],
  OCS: [
    { to: '/ocs/guias-recebidas', label: 'Guias recebidas' },
    { to: '/ocs/guias-finalizadas', label: 'Guias Finalizadas' },
    { to: '/ocs/espelho', label: 'Espelho' },
    { to: '/ocs/glosas', label: 'Glosas Recebidas' },
  ],
}
