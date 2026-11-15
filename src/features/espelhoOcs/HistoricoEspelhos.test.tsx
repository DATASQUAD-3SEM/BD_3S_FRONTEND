import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import HistoricoEspelhos from './HistoricoEspelhos'
import { espelhoApi } from './api'
import type { Espelho } from './types'

vi.mock('./api', () => ({
  espelhoApi: { listarHistorico: vi.fn() },
}))

function enviado(id: number, valorTotal: number, dataEnvio: string): Espelho {
  return {
    id,
    dataInicio: '2026-11-03T14:00:00',
    dataEnvio: dataEnvio,
    valorTotal,
    itens: [],
  }
}

function renderizar() {
  return render(
    <MemoryRouter>
      <HistoricoEspelhos />
    </MemoryRouter>,
  )
}

describe('HistoricoEspelhos (T20-FE5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mostra o carregamento enquanto busca o historico', () => {
    vi.mocked(espelhoApi.listarHistorico).mockReturnValue(new Promise(() => {}))
    renderizar()
    expect(screen.getByTestId('skeleton-historico')).toBeInTheDocument()
  })

  it('sem espelhos enviados, mostra a mensagem de vazio', async () => {
    vi.mocked(espelhoApi.listarHistorico).mockResolvedValue([])
    renderizar()
    expect(await screen.findByText('Nenhum espelho enviado ainda.')).toBeInTheDocument()
  })

  it('lista os espelhos na ordem recebida, com numero, periodo, valor e Ver detalhes', async () => {
    vi.mocked(espelhoApi.listarHistorico).mockResolvedValue([
      enviado(9, 450, '2026-11-15T10:00:00'),
      enviado(3, 120, '2026-10-10T18:00:00'),
    ])
    renderizar()

    expect(await screen.findByText('Espelho nº 9')).toBeInTheDocument()
    expect(screen.getByText('03/11/2026 a 15/11/2026')).toBeInTheDocument()
    expect(screen.getByText(/450,00/)).toBeInTheDocument()

    const links = screen.getAllByRole('link', { name: 'Ver detalhes' })
    expect(links.map((link) => link.getAttribute('href'))).toEqual([
      '/ocs/espelho/historico/9',
      '/ocs/espelho/historico/3',
    ])
  })

  it('erro ao carregar mostra a mensagem e tenta de novo', async () => {
    vi.mocked(espelhoApi.listarHistorico)
      .mockRejectedValueOnce(new Error('falha'))
      .mockResolvedValueOnce([])
    renderizar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar o histórico de espelhos.')
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Nenhum espelho enviado ainda.')).toBeInTheDocument()
  })
})
