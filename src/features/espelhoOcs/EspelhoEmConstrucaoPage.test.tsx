import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import EspelhoEmConstrucaoPage from './EspelhoEmConstrucaoPage'
import { espelhoApi, guiasFinalizadasApi } from './api'
import type { Espelho } from './types'

vi.mock('./api', () => ({
  espelhoApi: {
    buscarEmConstrucao: vi.fn(),
    adicionarGuia: vi.fn(),
    editarValores: vi.fn(),
    removerGuias: vi.fn(),
  },
  guiasFinalizadasApi: { listar: vi.fn(), obterPdf: vi.fn() },
}))

const espelhoComDuasGuias: Espelho = {
  id: 7,
  dataInicio: '2026-11-03T14:00:00',
  dataEnvio: null,
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

const espelhoSoComGuia11: Espelho = {
  id: 7,
  dataInicio: '2026-11-03T14:00:00',
  dataEnvio: null,
  valorTotal: 100,
  itens: [espelhoComDuasGuias.itens[2]],
}

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

describe('EspelhoEmConstrucaoPage (T20-FE3)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:guia')
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  it('mostra o carregamento enquanto busca o espelho', () => {
    vi.mocked(espelhoApi.buscarEmConstrucao).mockReturnValue(new Promise(() => {}))
    renderizar()
    expect(screen.getByText('Carregando espelho…')).toBeInTheDocument()
  })

  it('sem espelho em construcao, avisa que nao esta mais disponivel', async () => {
    vi.mocked(espelhoApi.buscarEmConstrucao).mockResolvedValue({
      id: null, dataInicio: null, dataEnvio: null, itens: [], valorTotal: 0,
    })
    renderizar()
    expect(await screen.findByText('Este espelho não está mais disponível.')).toBeInTheDocument()
  })

  it('mostra as guias agrupadas e o valor total do espelho', async () => {
    vi.mocked(espelhoApi.buscarEmConstrucao).mockResolvedValue(espelhoComDuasGuias)
    renderizar()

    expect(await screen.findByRole('checkbox', { name: 'Guia nº 202610701' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Guia nº 202610702' })).toBeInTheDocument()
    expect(screen.getByText('VALOR TOTAL')).toBeInTheDocument()
    expect(screen.getByText(/310,00/)).toBeInTheDocument()
  })

  it('sem selecao, nao mostra Remover nem Editar valores', async () => {
    vi.mocked(espelhoApi.buscarEmConstrucao).mockResolvedValue(espelhoComDuasGuias)
    renderizar()

    await screen.findByRole('checkbox', { name: 'Guia nº 202610701' })
    expect(screen.queryByRole('button', { name: 'Remover' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar valores' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Adicionar guia' })).toHaveAttribute('href', '/ocs/guias-finalizadas')
  })

  it('Editar valores so habilita com exatamente uma guia selecionada', async () => {
    vi.mocked(espelhoApi.buscarEmConstrucao).mockResolvedValue(espelhoComDuasGuias)
    renderizar()

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Guia nº 202610701' }))
    expect(screen.getByRole('button', { name: 'Editar valores' })).toBeEnabled()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Guia nº 202610702' }))
    expect(screen.getByRole('button', { name: 'Editar valores' })).toBeDisabled()
  })

  it('remover pede confirmacao, Cancelar nao remove e Sim, remover atualiza o espelho', async () => {
    vi.mocked(espelhoApi.buscarEmConstrucao).mockResolvedValue(espelhoComDuasGuias)
    vi.mocked(espelhoApi.removerGuias).mockResolvedValue(espelhoSoComGuia11)
    renderizar()

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Guia nº 202610701' }))
    await userEvent.click(screen.getByRole('button', { name: 'Remover' }))
    expect(
      screen.getByText(
        'Remover a guia nº 202610701 do espelho? Ela volta para Guias Finalizadas e pode ser adicionada de novo.',
      ),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(espelhoApi.removerGuias).not.toHaveBeenCalled()
    expect(screen.getByRole('checkbox', { name: 'Guia nº 202610701' })).toBeChecked()

    await userEvent.click(screen.getByRole('button', { name: 'Remover' }))
    await userEvent.click(screen.getByRole('button', { name: 'Sim, remover' }))

    await waitFor(() => expect(espelhoApi.removerGuias).toHaveBeenCalledWith([10]))
    const rodape = await screen.findByText('VALOR TOTAL')
    expect(rodape.parentElement).toHaveTextContent(/100,00/)
    expect(screen.queryByRole('checkbox', { name: 'Guia nº 202610701' })).not.toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Guia nº 202610702' })).toBeInTheDocument()
  })

  it('remover a ultima guia volta para a visao geral do espelho', async () => {
    vi.mocked(espelhoApi.buscarEmConstrucao).mockResolvedValue(espelhoComDuasGuias)
    vi.mocked(espelhoApi.removerGuias).mockResolvedValue({
      id: null, dataInicio: null, dataEnvio: null, itens: [], valorTotal: 0,
    })
    renderizar()

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Guia nº 202610701' }))
    await userEvent.click(screen.getByRole('checkbox', { name: 'Guia nº 202610702' }))
    await userEvent.click(screen.getByRole('button', { name: 'Remover' }))
    expect(
      screen.getByText('Remover as 2 guias selecionadas do espelho? Elas voltam para Guias Finalizadas e podem ser adicionadas de novo.'),
    ).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Sim, remover' }))

    expect(await screen.findByText('Visão geral do espelho')).toBeInTheDocument()
  })

  it('editar valores envia os novos valores da guia e atualiza o total', async () => {
    vi.mocked(espelhoApi.buscarEmConstrucao).mockResolvedValue(espelhoComDuasGuias)
    vi.mocked(espelhoApi.editarValores).mockResolvedValue({
      ...espelhoComDuasGuias,
      valorTotal: 330,
      itens: [espelhoComDuasGuias.itens[0], espelhoComDuasGuias.itens[1], { ...espelhoComDuasGuias.itens[2], valorSessao: 120, valorTotal: 120 }],
    })
    renderizar()

    await userEvent.click(await screen.findByRole('checkbox', { name: 'Guia nº 202610702' }))
    await userEvent.click(screen.getByRole('button', { name: 'Editar valores' }))

    const campo = screen.getByLabelText('Valor por sessão de 40302040')
    expect(campo).toHaveValue('100,00')
    await userEvent.clear(campo)
    await userEvent.type(campo, '120')
    await userEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() =>
      expect(espelhoApi.editarValores).toHaveBeenCalledWith(11, [{ codDgp: '40302040', valorSessao: 120 }]),
    )
    expect(await screen.findByText(/330,00/)).toBeInTheDocument()
  })

  it('Ver guia (PDF) abre o visualizador somente leitura dentro do cartao', async () => {
    vi.mocked(espelhoApi.buscarEmConstrucao).mockResolvedValue(espelhoComDuasGuias)
    vi.mocked(guiasFinalizadasApi.obterPdf).mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }))
    renderizar()

    await userEvent.click((await screen.findAllByRole('button', { name: 'Ver guia (PDF)' }))[0])
    expect(await screen.findByText('Visualização somente leitura')).toBeInTheDocument()
  })

  it('erro ao carregar mostra a mensagem e tenta de novo', async () => {
    vi.mocked(espelhoApi.buscarEmConstrucao)
      .mockRejectedValueOnce(new Error('falha'))
      .mockResolvedValueOnce(espelhoComDuasGuias)
    renderizar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar o espelho.')
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByRole('checkbox', { name: 'Guia nº 202610701' })).toBeInTheDocument()
  })
})
