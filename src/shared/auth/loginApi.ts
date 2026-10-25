import { post } from '../api/http'
import type { Perfil } from '../layout/perfis'
import type { Sessao } from './sessao'

/**
 * Chamada de login: POST /auth/login com o CPF (ou nome de usuario) e a senha.
 * Login ou senha errados chegam como ApiError 401 com a mensagem generica do backend;
 * conta desativada chega como 403.
 */

interface RespostaLogin {
  login: string
  perfil: string
  nome: string
}

export async function entrar(login: string, senha: string): Promise<Sessao> {
  const resposta = await post<RespostaLogin>('/auth/login', { login: login.trim(), senha })
  return { login: resposta.login, perfil: resposta.perfil as Perfil, nome: resposta.nome }
}
