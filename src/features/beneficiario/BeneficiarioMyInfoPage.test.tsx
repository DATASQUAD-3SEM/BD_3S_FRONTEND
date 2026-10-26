import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { BeneficiarioProvider } from './BeneficiarioContext'
import MinhasInformacoesPage from './BeneficiarioMyInfoPage'
import { reiniciarEstadoMock } from './dadosBeneficiario'

/**
 * Testes da tela Minhas informacoes do beneficiario (T10-FE) usando os dados simulados.
 */

const ESPERA = { timeout: 3000 }

const BENEFICIARIO_INICIAL = {
  nome: 'Antonio Carlos',
  cpf: '12345678900',
  precCp: '45872213300',
  telefone: '(12) 98765-4321',
  dataNascimento: '1978-05-10',
  grupo: 'Exército Brasileiro · FUSEX',
  assinaturaCadastrada: false,
}

function renderizarPagina() {
  return render(
    <BeneficiarioProvider>
      <MinhasInformacoesPage />
    </BeneficiarioProvider>,
  )
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function preencherSenha(atual: string, nova: string, confirmacao: string) {
  fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: atual } })
  fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: nova } })
  fireEvent.change(screen.getByLabelText('Confirmar nova senha'), { target: { value: confirmacao } })
  fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }))
}

beforeEach(() => {
  reiniciarEstadoMock()

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const metodo = init?.method ?? 'GET'

      if (url === '/api/beneficiarios/me' && metodo === 'GET') {
        return Promise.resolve(jsonResponse(BENEFICIARIO_INICIAL))
      }

      if (url === '/api/beneficiarios/me/telefone' && metodo === 'PATCH') {
        const corpo = JSON.parse(init!.body as string) as { telefone: string }
        return Promise.resolve(jsonResponse({ telefone: corpo.telefone }))
      }

      if (url === '/api/usuarios/me/senha' && metodo === 'POST') {
        const corpo = JSON.parse(init!.body as string) as { senhaAtual: string }
        if (corpo.senhaAtual !== 'senha123') {
          return Promise.resolve(
            jsonResponse(
              {
                status: 422,
                erro: 'Unprocessable Entity',
                mensagem: 'Senha atual incorreta.',
                detalhes: ['senhaAtual: senha atual incorreta'],
                timestamp: '',
              },
              422,
            ),
          )
        }
        return Promise.resolve(new Response(null, { status: 204 }))
      }

      if (url === '/api/usuarios/me/assinatura' && metodo === 'PUT') {
        return Promise.resolve(jsonResponse({ assinaturaCadastrada: true }))
      }

      return Promise.resolve(new Response('', { status: 404 }))
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('Minhas informações (com mock)', () => {
  it('salva o telefone, mostra sucesso e desabilita o botão de novo', async () => {
    renderizarPagina()
    await screen.findByLabelText('Telefone', {}, ESPERA)

    fireEvent.change(screen.getByLabelText('Telefone'), { target: { value: '(12) 91111-2222' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar telefone' }))

    expect(await screen.findByText('Telefone salvo com sucesso.', {}, ESPERA)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar telefone' })).toBeDisabled()
  })

  it('senha atual errada mostra erro no próprio campo e mantém os outros valores', async () => {
    renderizarPagina()
    await screen.findByLabelText('Senha atual', {}, ESPERA)

    preencherSenha('errada', 'nova12345', 'nova12345')

    expect(await screen.findByText('Senha atual incorreta.', {}, ESPERA)).toBeInTheDocument()
    expect(screen.getByLabelText('Senha atual')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Nova senha')).toHaveValue('nova12345')
  })

  it('nova senha igual à atual não envia e mostra erro', async () => {
    renderizarPagina()
    await screen.findByLabelText('Senha atual', {}, ESPERA)

    preencherSenha('senha123', 'senha123', 'senha123')

    expect(
      await screen.findByText('A nova senha precisa ser diferente da senha atual.'),
    ).toBeInTheDocument()
  })

  it('senha correta mostra sucesso e limpa os três campos', async () => {
    renderizarPagina()
    await screen.findByLabelText('Senha atual', {}, ESPERA)

    preencherSenha('senha123', 'nova12345', 'nova12345')

    expect(await screen.findByText('Senha alterada com sucesso.', {}, ESPERA)).toBeInTheDocument()
    expect(screen.getByLabelText('Senha atual')).toHaveValue('')
    expect(screen.getByLabelText('Nova senha')).toHaveValue('')
    expect(screen.getByLabelText('Confirmar nova senha')).toHaveValue('')
  })

  it('começa com assinatura "Ainda não cadastrada"', async () => {
    renderizarPagina()

    expect(await screen.findByText('Ainda não cadastrada', {}, ESPERA)).toBeInTheDocument()
  })
})
