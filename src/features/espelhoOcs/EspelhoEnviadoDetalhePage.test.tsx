import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import EspelhoEnviadoDetalhePage from './EspelhoEnviadoDetalhePage'
import { espelhoApi, guiasFinalizadasApi } from './api'
import type { Espelho } from './types'

vi.mock('./api', () => ({
  espelhoApi: { listarHistorico: vi.fn() },
  guiasFinalizadasApi: { obterPdf: vi.fn() },
}))

const espelhoEnviado: Espelho = {
  id: 3,
  dataInicio: '2026-10-01T08:00:00',
  dataEnvio: '2026-10-31T18:00:00',
  valorTotal: 310,
  itens: [
    {
      guiaId: 10, numeroGuia: '202610701', paciente: 'Antonio Carlos Ferreira', codDgp: '40304361',
      descricao: 'Hemograma completo', quantidadeSessoes: 2, valorSessao: 60, valorTotal: 120,
    },
    {
      guiaId: 10, numeroGuia: '202610701', paciente: 'Antonio Carlos Ferreira', codDgp: '40301630',
      descricao: 'Glicose', quantidadeSessoes: 1, valorSessao: 90, valorTotal: 90,
    },
    {
      guiaId: 11, numeroGuia: '202610702', paciente: 'Maria Silva', codDgp: '40302040',
      descricao: 'Colesterol total', quantidadeSessoes: 1, valorSessao: 100, valorTotal: 100,
    },
  ],
}

function renderizar(caminho: string) {
  return render(
    <MemoryRouter initialEntries={[caminho]}>
      <Routes>
        <Route path="/ocs/espelho/historico/:id" element={<EspelhoEnviadoDetalhePage />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('EspelhoEnviadoDetalhePage (T20-FE5)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:guia')
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  it('mostra o espelho enviado em modo somente leitura', async () => {
    vi.mocked(espelhoApi.listarHistorico).mockResolvedValue([espelhoEnviado])
    renderizar('/ocs/espelho/historico/3')

    expect(await screen.findByRole('heading', { name: 'Espelho nº 3' })).toBeInTheDocument()
    expect(screen.getByText('Período: 01/10/2026 a 31/10/2026')).toBeInTheDocument()
    expect(screen.getByText(/310,00/)).toBeInTheDocument()
    expect(screen.getByText('Colesterol total')).toBeInTheDocument()
  })

  it('nao tem nenhum controle de edicao, remocao ou envio', async () => {
    vi.mocked(espelhoApi.listarHistorico).mockResolvedValue([espelhoEnviado])
    renderizar('/ocs/espelho/historico/3')

    await screen.findByRole('heading', { name: 'Espelho nº 3' })
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Remover|Editar|Salvar|Enviar|Adicionar/ })).not.toBeInTheDocument()
  })

  it('o botao de voltar leva para o espelho', async () => {
    vi.mocked(espelhoApi.listarHistorico).mockResolvedValue([espelhoEnviado])
    renderizar('/ocs/espelho/historico/3')

    expect(await screen.findByRole('link', { name: '← Espelho' })).toHaveAttribute('href', '/ocs/espelho')
  })

  it('Ver guia (PDF) abre o visualizador somente leitura logo abaixo da guia', async () => {
    vi.mocked(espelhoApi.listarHistorico).mockResolvedValue([espelhoEnviado])
    vi.mocked(guiasFinalizadasApi.obterPdf).mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }))
    renderizar('/ocs/espelho/historico/3')

    const botoes = await screen.findAllByRole('button', { name: 'Ver guia (PDF)' })
    await userEvent.click(botoes[0])

    expect(await screen.findByText('Visualização somente leitura')).toBeInTheDocument()
    expect(guiasFinalizadasApi.obterPdf).toHaveBeenCalledWith(10)
  })

  it('espelho que nao e da OCS ou nao existe mostra a mensagem de nao encontrado', async () => {
    vi.mocked(espelhoApi.listarHistorico).mockResolvedValue([espelhoEnviado])
    renderizar('/ocs/espelho/historico/99')

    expect(await screen.findByText('Espelho não encontrado.')).toBeInTheDocument()
  })
})
