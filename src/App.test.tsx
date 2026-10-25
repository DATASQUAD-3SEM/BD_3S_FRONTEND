import { afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App'
import { encerrarSessao, salvarSessao } from './shared/auth/sessao'
import type { Perfil } from './shared/layout/perfis'

/**
 * Testes das rotas do App: login obrigatorio, bloqueio de areas de outros perfis
 * e a navegacao de Minhas pre-guias para a tela de correcao (T9-FE).
 */

// As rotas usam os clientes reais por padrão; nos testes eles são trocados pelos mocks.
vi.mock('./features/minhasPreGuias/api', async () => {
  const mock = await import('./features/minhasPreGuias/api.mock')
  return { minhasPreGuiasApi: mock.apiMock }
})

vi.mock('./features/minhasPreGuias/correcao/correcaoApi', async () => {
  const { correcaoMock, ocsMock } = await import('./features/minhasPreGuias/correcao/correcaoApi.mock')
  return {
    correcaoApi: {
      obterCorrecao: vi.fn().mockResolvedValue(correcaoMock),
      buscarEncaminhamento: vi.fn().mockResolvedValue(new Blob(['img'], { type: 'image/jpeg' })),
      buscarOcs: vi.fn().mockResolvedValue(ocsMock),
      reenviar: vi.fn(),
    },
  }
})

const LOGINS: Record<Perfil, string> = {
  BENEFICIARIO: '52998224725',
  MEDICO: '11144477735',
  CHEFE_FUSEX: 'chefe.fusex',
  SETOR_GUIAS: 'setor.guias',
  RECEPCAO: 'recepcao',
}

function entrarComo(perfil: Perfil) {
  salvarSessao({ login: LOGINS[perfil], perfil, nome: 'Teste' })
}

function renderizar(rota: string) {
  render(
    <MemoryRouter initialEntries={[rota]}>
      <App />
    </MemoryRouter>,
  )
}

afterEach(() => encerrarSessao())

describe('App: login e acesso por perfil', () => {
  it('sem login, qualquer área leva para a tela de login', () => {
    renderizar('/medico/nova-pre-guia')
    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument()
  })

  it('a raiz leva quem não entrou para o login', () => {
    renderizar('/')
    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument()
  })

  it('o beneficiário não abre a Nova pré-guia do médico: volta para a própria área', () => {
    entrarComo('BENEFICIARIO')
    renderizar('/medico/nova-pre-guia')
    expect(screen.getByRole('link', { name: 'Minhas pré-guias' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Corrigir pré-guias' })).not.toBeInTheDocument()
  })

  it('o médico não abre a área do Setor de Guias nem a da Recepção', () => {
    entrarComo('MEDICO')
    renderizar('/setor-guias/fila')
    expect(screen.getByRole('link', { name: 'Corrigir pré-guias' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Fila de pré-guias' })).not.toBeInTheDocument()
  })

  it('a recepção não abre a área do Chefe', () => {
    entrarComo('RECEPCAO')
    renderizar('/chefe/beneficiarios')
    expect(screen.getByRole('link', { name: 'Guias para impressão' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Beneficiários' })).not.toBeInTheDocument()
  })

  it('quem já entrou e abre /login vai para a própria área', () => {
    entrarComo('SETOR_GUIAS')
    renderizar('/login')
    expect(screen.getByRole('link', { name: 'Fila de pré-guias' })).toBeInTheDocument()
  })

  it('"Sair" encerra a sessão e volta para o login', async () => {
    entrarComo('CHEFE_FUSEX')
    renderizar('/chefe/medicos')
    await userEvent.click(screen.getByRole('button', { name: 'Sair' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Entrar' })).toBeInTheDocument()
    expect(localStorage.getItem('X-Usuario-Login')).toBeNull()
  })
})

describe('App (T9-FE · rotas do beneficiário)', () => {
  it('"Visualizar e corrigir" em Minhas pré-guias abre a tela de correção', async () => {
    entrarComo('BENEFICIARIO')
    renderizar('/pre-guias')
    const cartao = await screen.findByLabelText('Pré-guia 0003')
    await userEvent.click(within(cartao).getByRole('button', { name: 'Visualizar e corrigir' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Pré-guia 0003' })).toBeInTheDocument()
  })

  it('a rota /pre-guias/:id/corrigir mostra a tela de correção', async () => {
    entrarComo('BENEFICIARIO')
    renderizar('/pre-guias/3/corrigir')
    expect(await screen.findByRole('heading', { level: 1, name: 'Pré-guia 0003' })).toBeInTheDocument()
  })
})
