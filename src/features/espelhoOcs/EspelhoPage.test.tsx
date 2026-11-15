import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import EspelhoPage from './EspelhoPage'
import { espelhoApi } from './api'
import type { Espelho } from './types'

vi.mock('./api', () => ({
  espelhoApi: { buscarEmConstrucao: vi.fn(), listarHistorico: vi.fn().mockResolvedValue([]) },
}))

const vazio: Espelho = { id: null, dataInicio: null, dataEnvio: null, itens: [], valorTotal: 0 }

const comGuias: Espelho = {
  id: 1,
  dataInicio: '2026-11-03T14:00:00',
  dataEnvio: null,
  valorTotal: 210,
  itens: [
    {
      guiaId: 10, numeroGuia: '202610701', paciente: 'Antonio Carlos', codDgp: '40304361',
      descricao: 'Hemograma completo', quantidadeSessoes: 2, valorSessao: 60, valorTotal: 120,
    },
    {
      guiaId: 11, numeroGuia: '202610702', paciente: 'Maria Silva', codDgp: '40301630',
      descricao: 'Glicose', quantidadeSessoes: 1, valorSessao: 90, valorTotal: 90,
    },
  ],
}

function renderizar() {
  return render(
    <MemoryRouter>
      <EspelhoPage />
    </MemoryRouter>,
  )
}

describe('EspelhoPage (T20-FE1)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('mostra o cartao de carregamento enquanto busca o espelho', () => {
    vi.mocked(espelhoApi.buscarEmConstrucao).mockReturnValue(new Promise(() => {}))
    renderizar()
    expect(screen.getByTestId('skeleton-espelho')).toBeInTheDocument()
  })

  it('sem guias adicionadas, mostra o aviso e o botao para ir a Guias Finalizadas', async () => {
    vi.mocked(espelhoApi.buscarEmConstrucao).mockResolvedValue(vazio)
    renderizar()

    expect(await screen.findByText('Nenhuma guia adicionada ainda.')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Adicionar guia' })).toHaveAttribute(
      'href',
      '/ocs/guias-finalizadas',
    )
  })

  it('com guias, mostra o cartao com numero, data, quantidade e valor total', async () => {
    vi.mocked(espelhoApi.buscarEmConstrucao).mockResolvedValue(comGuias)
    renderizar()

    expect(await screen.findByText('Espelho nº 1 (em construção)')).toBeInTheDocument()
    expect(screen.getByText('Em construção desde 03/11/2026')).toBeInTheDocument()
    expect(screen.getByText('2 guias')).toBeInTheDocument()
    expect(screen.getByText(/210,00/)).toBeInTheDocument()
    expect(screen.queryByText('Nenhuma guia adicionada ainda.')).not.toBeInTheDocument()
  })

  it('o cartao abre o detalhe do espelho em construcao', async () => {
    vi.mocked(espelhoApi.buscarEmConstrucao).mockResolvedValue(comGuias)
    renderizar()

    expect(await screen.findByRole('link', { name: /Espelho nº 1/ })).toHaveAttribute(
      'href',
      '/ocs/espelho/atual',
    )
  })

  it('em caso de erro, mostra a mensagem e tenta de novo ao clicar', async () => {
    vi.mocked(espelhoApi.buscarEmConstrucao)
      .mockRejectedValueOnce(new Error('falha'))
      .mockResolvedValueOnce(vazio)
    renderizar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar o espelho.')
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Nenhuma guia adicionada ainda.')).toBeInTheDocument()
    expect(espelhoApi.buscarEmConstrucao).toHaveBeenCalledTimes(2)
  })

  it('mostra o marcador do historico de espelhos enviados', async () => {
    vi.mocked(espelhoApi.buscarEmConstrucao).mockResolvedValue(vazio)
    renderizar()

    expect(await screen.findByText('Histórico de espelhos enviados', { selector: 'h2' })).toBeInTheDocument()
  })
})
