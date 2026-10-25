import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import LoginPage from './LoginPage'
import { encerrarSessao, lerSessao } from '../../shared/auth/sessao'

/**
 * Testes da tela de login: envio das credenciais, mensagens de erro, botao Mostrar e acesso rapido.
 */

function json(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
}

function renderizar(state?: { de: string }) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/login', state }]}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/chefe/guias-para-assinar" element={<p>Area do chefe</p>} />
        <Route path="/beneficiario/inicio" element={<p>Area do beneficiario</p>} />
        <Route path="/pre-guias/nova" element={<p>Nova pre-guia do beneficiario</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  encerrarSessao()
})

describe('LoginPage', () => {
  it('envia CPF e senha, guarda a sessão e abre a área do perfil', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ login: 'chefe.fusex', perfil: 'CHEFE_FUSEX', nome: 'Maria Souza' }))
    vi.stubGlobal('fetch', fetchMock)
    renderizar()

    await userEvent.type(screen.getByLabelText('CPF ou nome de usuário'), 'chefe.fusex')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha123')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Area do chefe')).toBeInTheDocument()
    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/auth/login')
    expect(JSON.parse(init.body)).toEqual({ login: 'chefe.fusex', senha: 'senha123' })
    expect(lerSessao()).toEqual({ login: 'chefe.fusex', perfil: 'CHEFE_FUSEX', nome: 'Maria Souza' })
    expect(localStorage.getItem('X-Usuario-Login')).toBe('chefe.fusex')
  })

  it('volta para a rota pedida antes do login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ login: '52998224725', perfil: 'BENEFICIARIO', nome: 'Antonio' })))
    renderizar({ de: '/pre-guias/nova' })

    await userEvent.type(screen.getByLabelText('CPF ou nome de usuário'), '529.982.247-25')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha123')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByText('Nova pre-guia do beneficiario')).toBeInTheDocument()
  })

  it('login ou senha errados mostram a mensagem genérica do protótipo', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(json({ status: 401, mensagem: 'CPF, usuario ou senha incorretos.', detalhes: [] }, 401)),
    )
    renderizar()

    await userEvent.type(screen.getByLabelText('CPF ou nome de usuário'), '12345678900')
    await userEvent.type(screen.getByLabelText('Senha'), 'errada12')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    const alerta = await screen.findByRole('alert')
    expect(alerta).toHaveTextContent('CPF, usuário ou senha incorretos.')
    expect(alerta).toHaveTextContent('Confira os dados e tente novamente.')
    expect(lerSessao()).toBeNull()
  })

  it('conta desativada mostra aviso próprio', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(json({ status: 403, mensagem: 'Conta desativada.', detalhes: [] }, 403)))
    renderizar()

    await userEvent.type(screen.getByLabelText('CPF ou nome de usuário'), '39053344705')
    await userEvent.type(screen.getByLabelText('Senha'), 'senha1234')
    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Conta desativada.')
  })

  it('campos vazios não chamam o backend', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    renderizar()

    await userEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    expect(screen.getByRole('alert')).toHaveTextContent('Preencha o CPF (ou nome de usuário) e a senha.')
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('o botão Mostrar exibe e oculta a senha', async () => {
    renderizar()
    const senha = screen.getByLabelText('Senha')
    expect(senha).toHaveAttribute('type', 'password')

    await userEvent.click(screen.getByRole('button', { name: 'Mostrar' }))
    expect(senha).toHaveAttribute('type', 'text')

    await userEvent.click(screen.getByRole('button', { name: 'Ocultar' }))
    expect(senha).toHaveAttribute('type', 'password')
  })

  it('acesso rápido entra com a conta de exemplo do perfil', async () => {
    const fetchMock = vi.fn().mockResolvedValue(json({ login: 'chefe.fusex', perfil: 'CHEFE_FUSEX', nome: 'Maria Souza' }))
    vi.stubGlobal('fetch', fetchMock)
    renderizar()

    await userEvent.click(screen.getByRole('button', { name: /Entrar como Chefe do FUSEX/ }))

    expect(await screen.findByText('Area do chefe')).toBeInTheDocument()
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toEqual({ login: 'chefe.fusex', senha: 'senha123' })
  })
})
