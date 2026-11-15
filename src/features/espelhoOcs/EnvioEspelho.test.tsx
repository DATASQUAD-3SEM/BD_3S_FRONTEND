import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import EspelhoEmConstrucaoPage from './EspelhoEmConstrucaoPage'
import { espelhoApi } from './api'
import type { Espelho } from './types'

vi.mock('./api', () => ({
  espelhoApi: {
    buscarEmConstrucao: vi.fn(),
    adicionarGuia: vi.fn(),
    editarValores: vi.fn(),
    removerGuias: vi.fn(),
    enviar: vi.fn(),
  },
  guiasFinalizadasApi: { listar: vi.fn(), obterPdf: vi.fn() },
}))

const espelho: Espelho = {
  id: 7,
  dataInicio: '2026-11-03T14:00:00',
  dataEnvio: null,
  valorTotal: 120,
  itens: [
    {
      guiaId: 10, numeroGuia: '202610701', paciente: 'Antonio Carlos Ferreira', codDgp: '40304361',
      descricao: 'Hemograma completo', quantidadeSessoes: 2, valorSessao: 60, valorTotal: 120,
    },
  ],
}

const TEXTO_CONFIRMACAO =
  'Depois de enviado, este espelho não poderá mais ser editado, nem ter guias removidas ou adicionadas. Tem certeza que deseja enviar?'

function renderizar() {
  return render(
    <MemoryRouter initialEntries={['/ocs/espelho/atual']}>
      <Routes>
        <Route path="/ocs/espelho/atual" element={<EspelhoEmConstrucaoPage />} />
        <Route path="/ocs/espelho" element={<p>Visão geral do espelho</p>} />
        <Route path="/ocs/guias-finalizadas" element={<p>Guias Finalizadas</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('Envio do espelho ao FUSEX (T20-FE4)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('Enviar para o FUSEX abre a confirmacao, e Cancelar fecha sem enviar', async () => {
    vi.mocked(espelhoApi.buscarEmConstrucao).mockResolvedValue(espelho)
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Enviar para o FUSEX' }))
    expect(screen.getByText(TEXTO_CONFIRMACAO)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.queryByText(TEXTO_CONFIRMACAO)).not.toBeInTheDocument()
    expect(espelhoApi.enviar).not.toHaveBeenCalled()
    expect(screen.getByText('Guia nº 202610701')).toBeInTheDocument()
  })

  it('Sim, enviar envia o espelho e volta para a visao geral', async () => {
    vi.mocked(espelhoApi.buscarEmConstrucao).mockResolvedValue(espelho)
    vi.mocked(espelhoApi.enviar).mockResolvedValue({ ...espelho, dataEnvio: '2026-11-15T10:00:00' })
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Enviar para o FUSEX' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sim, enviar para o FUSEX' }))

    await waitFor(() => expect(espelhoApi.enviar).toHaveBeenCalledTimes(1))
    expect(await screen.findByText('Visão geral do espelho')).toBeInTheDocument()
  })

  it('erro ao enviar mostra a mensagem na confirmacao e mantem o espelho na tela', async () => {
    vi.mocked(espelhoApi.buscarEmConstrucao).mockResolvedValue(espelho)
    vi.mocked(espelhoApi.enviar).mockRejectedValue(new Error('Não há espelho em construção para enviar'))
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Enviar para o FUSEX' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sim, enviar para o FUSEX' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não há espelho em construção para enviar')
    expect(screen.getByText(TEXTO_CONFIRMACAO)).toBeInTheDocument()
    expect(screen.getByText('Guia nº 202610701')).toBeInTheDocument()
  })
})
