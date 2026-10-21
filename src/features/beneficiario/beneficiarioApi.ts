import { ApiError, patch, post, putForm } from '../../shared/api/http'
import { estadoMock } from './dadosBeneficiario'

/**
 * Chamadas da tela "Minhas informações".
 *
 * true: usa o mock local (nada é enviado ao backend).
 * false: chama o backend de verdade.
 */
const USAR_MOCK_MINHAS_INFORMACOES = false

/** Pequena pausa no mock, só para o usuário ver a mensagem "salvando". */
const ATRASO_MOCK_MS = 400

/** Contrato T13-BE1: 5 tentativas erradas seguidas bloqueiam a troca por 15 minutos. */
const MAX_TENTATIVAS_SENHA = 5
const MINUTOS_BLOQUEIO_SENHA = 15
const TAMANHO_MINIMO_SENHA = 8

function esperar(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

interface TelefoneSalvoResposta {
  telefone: string
}

/**
 * Salva o telefone do beneficiario logado. Recebe só os números (ex.: "12987654321").
 * Devolve o telefone salvo.
 * Contrato T10-BE2: PATCH /beneficiarios/me/telefone -> 200 { telefone } | 422 se o formato for inválido.
 */
export async function salvarTelefone(telefone: string): Promise<string> {
  if (USAR_MOCK_MINHAS_INFORMACOES) {
    await esperar(ATRASO_MOCK_MS)
    const digitos = telefone.replace(/\D/g, '')
    if (digitos.length !== 11) {
      throw new ApiError(422, 'Informe um telefone válido no formato (00) 00000-0000.')
    }
    estadoMock.telefone = digitos
    return digitos
  }

  const resposta = await patch<TelefoneSalvoResposta>('/beneficiarios/me/telefone', { telefone })
  return resposta.telefone
}

/**
 * Troca a senha do beneficiario logado.
 * Contrato T13-BE1: POST /usuarios/me/senha { senhaAtual, novaSenha, confirmacao }.
 * Erros: 422 (campo indicado em detalhes, ex.: "senhaAtual: ...") | 429 após muitas tentativas erradas.
 */
export async function alterarSenha(
  senhaAtual: string,
  novaSenha: string,
  confirmacao: string,
): Promise<void> {
  if (USAR_MOCK_MINHAS_INFORMACOES) {
    await esperar(ATRASO_MOCK_MS)

    if (estadoMock.bloqueadoAte !== null && Date.now() < estadoMock.bloqueadoAte) {
      throw new ApiError(
        429,
        `Muitas tentativas erradas. Aguarde ${MINUTOS_BLOQUEIO_SENHA} minutos e tente de novo.`,
      )
    }

    if (senhaAtual !== estadoMock.senha) {
      estadoMock.tentativasSenhaErrada += 1
      if (estadoMock.tentativasSenhaErrada >= MAX_TENTATIVAS_SENHA) {
        estadoMock.bloqueadoAte = Date.now() + MINUTOS_BLOQUEIO_SENHA * 60_000
        estadoMock.tentativasSenhaErrada = 0
      }
      throw new ApiError(422, 'Senha atual incorreta.', ['senhaAtual: senha atual incorreta'])
    }

    if (novaSenha.length < TAMANHO_MINIMO_SENHA) {
      throw new ApiError(422, 'A nova senha precisa ter no mínimo 8 caracteres.', ['novaSenha: tamanho mínimo'])
    }

    if (novaSenha === senhaAtual) {
      throw new ApiError(422, 'A nova senha precisa ser diferente da senha atual.', ['novaSenha: igual à atual'])
    }

    if (confirmacao !== novaSenha) {
      throw new ApiError(422, 'As senhas não coincidem.', ['confirmacao: diferente da nova senha'])
    }

    estadoMock.senha = novaSenha
    estadoMock.tentativasSenhaErrada = 0
    estadoMock.bloqueadoAte = null
    return
  }

  await post<void>('/usuarios/me/senha', { senhaAtual, novaSenha, confirmacao })
}

/**
 * Cadastra ou substitui a assinatura digital (imagem PNG).
 * Contrato T13-BE2: PUT /usuarios/me/assinatura, multipart com a imagem -> 200 { assinaturaCadastrada: true }.
 */
export async function salvarAssinatura(imagem: Blob): Promise<void> {
  if (USAR_MOCK_MINHAS_INFORMACOES) {
    await esperar(ATRASO_MOCK_MS)
    estadoMock.assinaturaCadastrada = true
    return
  }

  const formulario = new FormData()
  formulario.append('imagem', imagem, 'assinatura.png')
  await putForm<void>('/usuarios/me/assinatura', formulario)
}
