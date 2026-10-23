import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { MedicoProvider } from './MedicoContext'
import MedicoMyInfoPage from './MedicoMyInfoPage'
import { reiniciarEstadoMockMedico } from './dadosMedico'

const ESPERA = { timeout: 3000 }

const MEDICO_INICIAL = {
  nome: 'Carlos Eduardo Lima',
  patente: 'Capitão Médico',
  cpf: '11144477735',
  precCp: '11122233344',
  crm: '123456-SP',
  assinaturaCadastrada: false,
}

function renderizarPagina() {
  return render(
    <MedicoProvider>
      <MedicoMyInfoPage />
    </MedicoProvider>,
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

function stubBackend(overrides: Partial<Record<string, Response>> = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const metodo = init?.method ?? 'GET'
      const chave = `${metodo} ${url}`

      if (overrides[chave]) return Promise.resolve(overrides[chave])

      if (chave === 'GET /api/medicos/me/perfil') {
        return Promise.resolve(jsonResponse(MEDICO_INICIAL))
      }

      if (chave === 'POST /api/usuarios/me/senha') {
        const corpo = JSON.parse(init!.body as string) as { senhaAtual: string }
        if (corpo.senhaAtual !== 'senha123') {
          return Promise.resolve(
            jsonResponse(
              {
                status: 422,
                erro: 'Unprocessable Entity',
                mensagem: 'Dados invalidos',
                detalhes: ['senhaAtual: Senha atual incorreta'],
                timestamp: '',
              },
              422,
            ),
          )
        }
        return Promise.resolve(jsonResponse({ senhaAlterada: true }))
      }

      if (chave === 'PUT /api/usuarios/me/assinatura') {
        return Promise.resolve(jsonResponse({ assinaturaCadastrada: true }))
      }

      return Promise.resolve(new Response('', { status: 404 }))
    }),
  )
}

beforeEach(() => {
  reiniciarEstadoMockMedico()
  stubBackend()
})

afterEach(() => vi.unstubAllGlobals())

describe('Minhas informações do médico', () => {
  it('mostra os dados profissionais formatados e a nota de somente leitura', async () => {
    renderizarPagina()

    expect(await screen.findByText('Carlos Eduardo Lima', {}, ESPERA)).toBeInTheDocument()
    expect(screen.getByText('Capitão Médico')).toBeInTheDocument()
    expect(screen.getByText('111.444.777-35')).toBeInTheDocument()
    expect(screen.getByText('111222333-44')).toBeInTheDocument()
    expect(screen.getByText('123456-SP')).toBeInTheDocument()
    expect(screen.getByText('Para alterar esses dados, procure o Chefe do FUSEX.')).toBeInTheDocument()
  })

  it('não mostra campo de telefone (o médico não tem telefone)', async () => {
    renderizarPagina()
    await screen.findByText('Carlos Eduardo Lima', {}, ESPERA)

    expect(screen.queryByLabelText('Telefone')).not.toBeInTheDocument()
  })

  it('mostra o badge "Ainda não cadastrada" quando não há assinatura', async () => {
    renderizarPagina()

    expect(await screen.findByText('Ainda não cadastrada', {}, ESPERA)).toHaveClass('info-status-pendente')
  })

  it('mostra o badge "Cadastrada" quando a assinatura já existe', async () => {
    stubBackend({
      'GET /api/medicos/me/perfil': jsonResponse({ ...MEDICO_INICIAL, assinaturaCadastrada: true }),
    })
    renderizarPagina()

    expect(await screen.findByText('Cadastrada', {}, ESPERA)).toHaveClass('info-status-cadastrada')
  })

  it('senha atual errada mostra erro no próprio campo', async () => {
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

  it('mostra mensagem de erro quando o perfil não pode ser carregado', async () => {
    stubBackend({
      'GET /api/medicos/me/perfil': jsonResponse(
        { status: 403, erro: 'Forbidden', mensagem: 'Acesso restrito a medicos', detalhes: [], timestamp: '' },
        403,
      ),
    })
    renderizarPagina()

    expect(await screen.findByRole('alert', {}, ESPERA)).toHaveTextContent('Acesso restrito a medicos')
  })
})
