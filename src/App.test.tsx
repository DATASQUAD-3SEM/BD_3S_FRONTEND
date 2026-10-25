import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import App from './App'

/**
 * Testes das rotas do beneficiario no App: a navegacao de Minhas pre-guias para a tela de correcao (T9-FE).
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

function renderizar(rota: string) {
  render(
    <MemoryRouter initialEntries={[rota]}>
      <App />
    </MemoryRouter>,
  )
}

describe('App (T9-FE · rotas do beneficiário)', () => {
  it('"Visualizar e corrigir" em Minhas pré-guias abre a tela de correção', async () => {
    renderizar('/pre-guias')
    const cartao = await screen.findByLabelText('Pré-guia 0003')
    await userEvent.click(within(cartao).getByRole('button', { name: 'Visualizar e corrigir' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Pré-guia 0003' })).toBeInTheDocument()
  })

  it('a rota /pre-guias/:id/corrigir mostra a tela de correção', async () => {
    renderizar('/pre-guias/3/corrigir')
    expect(await screen.findByRole('heading', { level: 1, name: 'Pré-guia 0003' })).toBeInTheDocument()
  })
})
