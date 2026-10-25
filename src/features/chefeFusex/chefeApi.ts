import { ApiError, get, put, putForm } from '../../shared/api/http'
import type { ChefePerfil } from '../../shared/types/domain'
import { atualizarLoginDaSessao } from '../../shared/auth/sessao'
import type { DadosConta } from './validacaoDadosConta'
import { LOGIN_EM_USO_MOCK, estadoMockChefe, montarChefeMock } from './dadosChefe'


/**
 * Chamadas a API da tela Minhas informacoes do Chefe (T12-BE1, T12-BE2 e T13-BE2).
 * Com USAR_MOCK_CHEFE = true, as respostas vem de dadosChefe.ts, sem depender do backend.
 */

const USAR_MOCK_CHEFE = false

const ATRASO_MOCK_MS = 400

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}



export async function obterChefeLogado(): Promise<ChefePerfil> {
  if (USAR_MOCK_CHEFE) {
    await esperar(ATRASO_MOCK_MS)
    return montarChefeMock()
  }

  return get<ChefePerfil>('/chefe/me')
}


export async function salvarDadosChefe(
  dados: DadosConta,
  loginAnterior?: string,
): Promise<ChefePerfil> {
  const corpo = {
    nome: dados.nome.trim(),
    patente: dados.patente.trim(),
    login: dados.login.trim(),
    novaSenha: dados.novaSenha || null,
  }

  if (USAR_MOCK_CHEFE) {
    await esperar(ATRASO_MOCK_MS)

    if (corpo.login === LOGIN_EM_USO_MOCK) {
      throw new ApiError(409, 'Já existe um usuário com esse login.')
    }

    if (corpo.novaSenha && corpo.novaSenha.length < 8) {
      throw new ApiError(400, 'A nova senha deve ter pelo menos 8 caracteres.')
    }

    estadoMockChefe.nome = corpo.nome
    estadoMockChefe.patente = corpo.patente
    estadoMockChefe.login = corpo.login
    if (corpo.novaSenha) estadoMockChefe.senha = corpo.novaSenha

    return montarChefeMock()
  }

  const perfil = await put<ChefePerfil>('/chefe/me', corpo)

  // Se o chefe trocou o proprio login, a sessao passa a usar o login novo nas proximas chamadas
  atualizarLoginDaSessao(loginAnterior, perfil.login)

  return perfil
}


export async function salvarAssinatura(imagem: Blob): Promise<void> {
  if (USAR_MOCK_CHEFE) {
    await esperar(ATRASO_MOCK_MS)
    estadoMockChefe.assinaturaCadastrada = true
    return
  }

  const formulario = new FormData()
  formulario.append('arquivo', imagem, 'assinatura.png')
  await putForm<void>('/usuarios/me/assinatura', formulario)
}
