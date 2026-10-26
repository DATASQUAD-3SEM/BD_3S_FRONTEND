import { ApiError, get, post, putForm } from '../../shared/api/http'
import type { MedicoPerfil } from '../../shared/types/domain'
import { estadoMockMedico, montarMedicoMock } from './dadosMedico'

/**
 * Chamadas a API da tela Minhas informacoes do medico (T11-BE1, T13-BE1 e T13-BE2).
 */

const USAR_MOCK_MEDICO = false

const ATRASO_MOCK_MS = 400

const TAMANHO_MINIMO_SENHA = 8

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function obterMedicoLogado(): Promise<MedicoPerfil> {
  if (USAR_MOCK_MEDICO) {
    await esperar(ATRASO_MOCK_MS)
    return montarMedicoMock()
  }

  return get<MedicoPerfil>('/medicos/me/perfil')
}

export async function alterarSenha(
  senhaAtual: string,
  novaSenha: string,
  confirmacao: string,
): Promise<void> {
  if (USAR_MOCK_MEDICO) {
    await esperar(ATRASO_MOCK_MS)

    if (senhaAtual !== estadoMockMedico.senha) {
      throw new ApiError(422, 'Senha atual incorreta.', ['senhaAtual: senha atual incorreta'])
    }

    if (novaSenha.length < TAMANHO_MINIMO_SENHA) {
      throw new ApiError(422, 'A nova senha precisa ter no mínimo 8 caracteres.', ['novaSenha: tamanho mínimo'])
    }

    if (confirmacao !== novaSenha) {
      throw new ApiError(422, 'As senhas não coincidem.', ['confirmacao: diferente da nova senha'])
    }

    estadoMockMedico.senha = novaSenha
    return
  }

  await post<void>('/usuarios/me/senha', { senhaAtual, novaSenha, confirmacao })
}


export async function salvarAssinatura(imagem: Blob): Promise<void> {
  if (USAR_MOCK_MEDICO) {
    await esperar(ATRASO_MOCK_MS)
    estadoMockMedico.assinaturaCadastrada = true
    return
  }

  const formulario = new FormData()
  formulario.append('arquivo', imagem, 'assinatura.png')
  await putForm<void>('/usuarios/me/assinatura', formulario)
}
