import type { Perfil } from '../layout/perfis'

/**
 * Sessao do usuario logado, guardada no localStorage do navegador.
 *
 * Depois do login (POST /auth/login), o login da conta tambem e gravado na chave X-Usuario-Login,
 * que o cliente HTTP (shared/api/http.ts) envia em todas as chamadas. As rotas protegidas
 * (RotaProtegida) leem o perfil daqui para liberar somente as telas daquele tipo de usuario.
 */

export interface Sessao {
  login: string
  perfil: Perfil
  nome: string
}

export const CHAVE_SESSAO = 'nexus-sessao'
export const CHAVE_LOGIN = 'X-Usuario-Login'

const PERFIS_VALIDOS: Perfil[] = ['BENEFICIARIO', 'MEDICO', 'CHEFE_FUSEX', 'SETOR_GUIAS', 'RECEPCAO']

/** Le a sessao atual; devolve null se nao houver login ou se o conteudo guardado for invalido. */
export function lerSessao(): Sessao | null {
  try {
    const bruto = localStorage.getItem(CHAVE_SESSAO)
    if (!bruto) return null
    const sessao = JSON.parse(bruto) as Partial<Sessao>
    if (!sessao.login || !sessao.perfil || !PERFIS_VALIDOS.includes(sessao.perfil)) return null
    return { login: sessao.login, perfil: sessao.perfil, nome: sessao.nome ?? '' }
  } catch {
    return null
  }
}

export function salvarSessao(sessao: Sessao): void {
  try {
    localStorage.setItem(CHAVE_SESSAO, JSON.stringify(sessao))
    localStorage.setItem(CHAVE_LOGIN, sessao.login)
  } catch {
    // sem localStorage (ex.: modo privado restrito): o login vale apenas ate recarregar a pagina
  }
}

export function encerrarSessao(): void {
  try {
    localStorage.removeItem(CHAVE_SESSAO)
    localStorage.removeItem(CHAVE_LOGIN)
  } catch {
    // nada a limpar
  }
}

/** Usado quando o Chefe troca o proprio login em Minhas informacoes: as proximas chamadas usam o login novo. */
export function atualizarLoginDaSessao(loginAnterior: string | undefined, loginNovo: string): void {
  const sessao = lerSessao()
  if (!sessao || !loginAnterior || sessao.login !== loginAnterior) return
  salvarSessao({ ...sessao, login: loginNovo })
}
