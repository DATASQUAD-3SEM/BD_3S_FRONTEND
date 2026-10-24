import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { ChefeProvider } from './ChefeContext'
import ChefeMyInfoPage from './ChefeMyInfoPage'
import { reiniciarEstadoMockChefe } from './dadosChefe'

const ESPERA = { timeout: 3000 }

const CHEFE_INICIAL = {
  nome: 'Chefe do FUSEX',
  patente: 'Coronel',
  login: 'chefe.fusex',
  assinaturaCadastrada: false,
}

function renderizarPagina() {
  return render(
    <ChefeProvider>
      <ChefeMyInfoPage />
    </ChefeProvider>,
  )
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function erroBackend(status: number, mensagem: string, detalhes: string[] = []): Response {
  return jsonResponse({ status, erro: 'Erro', mensagem, detalhes, timestamp: '' }, status)
}

function stubBackend(overrides: Partial<Record<string, Response>> = {}) {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const chave = `${init?.method ?? 'GET'} ${url}`

      if (overrides[chave]) return Promise.resolve(overrides[chave])

      if (chave === 'GET /api/chefe/me') return Promise.resolve(jsonResponse(CHEFE_INICIAL))

      if (chave === 'PUT /api/chefe/me') {
        const corpo = JSON.parse(init!.body as string) as { nome: string; patente: string; login: string }
        return Promise.resolve(
          jsonResponse({ ...CHEFE_INICIAL, nome: corpo.nome, patente: corpo.patente, login: corpo.login }),
        )
      }

      if (chave === 'PUT /api/usuarios/me/assinatura') {
        return Promise.resolve(jsonResponse({ assinaturaCadastrada: true }))
      }

      return Promise.resolve(new Response('', { status: 404 }))
    }),
  )
}

function contarChamadas(metodo: string, url: string): number {
  return vi
    .mocked(fetch)
    .mock.calls.filter(([u, init]) => u === url && (init?.method ?? 'GET') === metodo).length
}

beforeEach(() => {
  reiniciarEstadoMockChefe()
  stubBackend()
})

afterEach(() => vi.unstubAllGlobals())

describe('Minhas informações do chefe', () => {
  it('mostra os dados da conta preenchidos com os valores do chefe', async () => {
    renderizarPagina()

    expect(await screen.findByDisplayValue('Chefe do FUSEX', {}, ESPERA)).toBeInTheDocument()
    expect(screen.getByLabelText('Patente')).toHaveValue('Coronel')
    expect(screen.getByLabelText('Nome de usuário (login)')).toHaveValue('chefe.fusex')
    expect(screen.getByLabelText('Nova senha (deixe em branco para manter)')).toHaveValue('')
  })

  it('não envia nada quando o nome está vazio e mostra o erro no campo', async () => {
    renderizarPagina()
    const nome = await screen.findByLabelText('Nome', {}, ESPERA)

    fireEvent.change(nome, { target: { value: '   ' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('O nome é obrigatório.')).toBeInTheDocument()
    expect(contarChamadas('PUT', '/api/chefe/me')).toBe(0)
  })

  it('login com espaços mostra erro no campo e não envia', async () => {
    renderizarPagina()
    const login = await screen.findByLabelText('Nome de usuário (login)', {}, ESPERA)

    fireEvent.change(login, { target: { value: 'chefe novo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('O login não pode conter espaços.')).toBeInTheDocument()
    expect(contarChamadas('PUT', '/api/chefe/me')).toBe(0)
  })

  it('nova senha com menos de 8 caracteres mostra erro no campo', async () => {
    renderizarPagina()
    const senha = await screen.findByLabelText('Nova senha (deixe em branco para manter)', {}, ESPERA)

    fireEvent.change(senha, { target: { value: 'curta' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText(/mínimo 8 caracteres/)).toBeInTheDocument()
    expect(contarChamadas('PUT', '/api/chefe/me')).toBe(0)
  })

  it('salvar com sucesso mostra mensagem e limpa a senha digitada', async () => {
    renderizarPagina()
    const patente = await screen.findByLabelText('Patente', {}, ESPERA)
    const senha = screen.getByLabelText('Nova senha (deixe em branco para manter)')

    fireEvent.change(patente, { target: { value: 'General' } })
    fireEvent.change(senha, { target: { value: 'nova12345' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Dados atualizados com sucesso.', {}, ESPERA)).toBeInTheDocument()
    expect(screen.getByLabelText('Patente')).toHaveValue('General')
    expect(senha).toHaveValue('')
  })

  it('login já existente (409) mostra o erro no campo login', async () => {
    stubBackend({
      'PUT /api/chefe/me': erroBackend(409, 'Já existe um usuário com esse login.'),
    })
    renderizarPagina()
    const login = await screen.findByLabelText('Nome de usuário (login)', {}, ESPERA)

    fireEvent.change(login, { target: { value: 'medico.outro' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Já existe um usuário com esse login.', {}, ESPERA)).toBeInTheDocument()
    expect(login).toHaveAttribute('aria-invalid', 'true')
  })

  it('mostra o badge "Ainda não cadastrada" quando não há assinatura', async () => {
    renderizarPagina()

    expect(await screen.findByText('Ainda não cadastrada', {}, ESPERA)).toHaveClass('info-status-pendente')
  })

  it('mostra mensagem de erro quando o perfil não pode ser carregado', async () => {
    stubBackend({
      'GET /api/chefe/me': erroBackend(403, 'Apenas o Chefe do FuSEx pode atualizar este perfil.'),
    })
    renderizarPagina()

    expect(await screen.findByRole('alert', {}, ESPERA)).toHaveTextContent(
      'Apenas o Chefe do FuSEx pode atualizar este perfil.',
    )
  })
})
