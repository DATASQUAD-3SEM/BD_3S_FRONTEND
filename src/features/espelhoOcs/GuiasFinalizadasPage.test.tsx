import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import GuiasFinalizadasPage from './GuiasFinalizadasPage'
import { espelhoApi, guiasFinalizadasApi } from './api'
import type { GuiaFinalizada } from './types'

vi.mock('./api', () => ({
  espelhoApi: { buscarEmConstrucao: vi.fn(), adicionarGuia: vi.fn() },
  guiasFinalizadasApi: { listar: vi.fn(), obterPdf: vi.fn() },
}))

const disponivel: GuiaFinalizada = {
  id: 1,
  numero: '202610703',
  beneficiario: { nome: 'Antonio Carlos Ferreira', precCp: '458722133-00' },
  procedimentos: [
    { codDgp: '40304361', descricao: 'Hemograma completo', quantidade: 2, quantidadeAssinadas: 2 },
    { codDgp: '40301630', descricao: 'Glicose', quantidade: 1, quantidadeAssinadas: 1 },
  ],
  dataEnvio: '2026-10-10T11:00:00',
  situacao: 'REALIZADA',
  vinculo: 'DISPONIVEL',
  idEspelho: null,
}

const vinculada: GuiaFinalizada = {
  id: 2,
  numero: '202610702',
  beneficiario: { nome: 'Maria Silva', precCp: '458722134-00' },
  procedimentos: [{ codDgp: '40302040', descricao: 'Colesterol total', quantidade: 1, quantidadeAssinadas: 1 }],
  dataEnvio: '2026-09-15T10:00:00',
  situacao: 'ENCERRADA',
  vinculo: 'EM_CONSTRUCAO',
  idEspelho: 5,
}

function renderizar() {
  return render(<GuiasFinalizadasPage />)
}

describe('GuiasFinalizadasPage (T20-FE2)', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    globalThis.URL.createObjectURL = vi.fn(() => 'blob:guia')
    globalThis.URL.revokeObjectURL = vi.fn()
  })

  it('mostra o carregamento enquanto busca as guias', () => {
    vi.mocked(guiasFinalizadasApi.listar).mockReturnValue(new Promise(() => {}))
    renderizar()
    expect(screen.getByTestId('skeleton-guias')).toBeInTheDocument()
  })

  it('sem guias finalizadas, mostra a mensagem de lista vazia', async () => {
    vi.mocked(guiasFinalizadasApi.listar).mockResolvedValue([])
    renderizar()
    expect(await screen.findByText('Nenhuma guia finalizada até o momento.')).toBeInTheDocument()
  })

  it('mostra o botao de adicionar para guia disponivel e o texto de vinculo para guia ja usada', async () => {
    vi.mocked(guiasFinalizadasApi.listar).mockResolvedValue([disponivel, vinculada])
    renderizar()

    expect(await screen.findByRole('heading', { name: 'Guia nº 202610703' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Adicionar para o espelho' })).toBeInTheDocument()
    expect(screen.getByText('Já no espelho em construção (nº 5)')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Ver guia (PDF)' })).toHaveLength(2)
  })

  it('o botao Enviar so habilita com todos os valores preenchidos e envia os valores', async () => {
    vi.mocked(guiasFinalizadasApi.listar)
      .mockResolvedValueOnce([disponivel])
      .mockResolvedValueOnce([{ ...disponivel, vinculo: 'EM_CONSTRUCAO', idEspelho: 7 }])
    vi.mocked(espelhoApi.adicionarGuia).mockResolvedValue({
      id: 7, dataInicio: null, dataEnvio: null, itens: [], valorTotal: 0,
    })
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Adicionar para o espelho' }))
    const enviar = screen.getByRole('button', { name: 'Enviar' })
    expect(enviar).toBeDisabled()

    await userEvent.type(screen.getByLabelText('Valor por sessão de 40304361'), '60')
    expect(enviar).toBeDisabled()
    await userEvent.type(screen.getByLabelText('Valor por sessão de 40301630'), '90,50')
    expect(enviar).toBeEnabled()

    await userEvent.click(enviar)

    await waitFor(() => {
      expect(espelhoApi.adicionarGuia).toHaveBeenCalledWith(1, [
        { codDgp: '40304361', valorSessao: 60 },
        { codDgp: '40301630', valorSessao: 90.5 },
      ])
    })
    await waitFor(() => expect(guiasFinalizadasApi.listar).toHaveBeenCalledTimes(2))
    expect(await screen.findByText('Já no espelho em construção (nº 7)')).toBeInTheDocument()
    expect(screen.queryByLabelText('Valor por sessão de 40304361')).not.toBeInTheDocument()
  })

  it('erro ao enviar mostra a mensagem dentro do painel e mantem os valores digitados', async () => {
    vi.mocked(guiasFinalizadasApi.listar).mockResolvedValue([disponivel])
    vi.mocked(espelhoApi.adicionarGuia).mockRejectedValue(new Error('Guia já vinculada a um espelho'))
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Adicionar para o espelho' }))
    await userEvent.type(screen.getByLabelText('Valor por sessão de 40304361'), '60')
    await userEvent.type(screen.getByLabelText('Valor por sessão de 40301630'), '90')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Guia já vinculada a um espelho')
    expect(screen.getByLabelText('Valor por sessão de 40304361')).toHaveValue('60')
    expect(screen.getByLabelText('Valor por sessão de 40301630')).toHaveValue('90')
  })

  it('Cancelar fecha o painel sem enviar nada', async () => {
    vi.mocked(guiasFinalizadasApi.listar).mockResolvedValue([disponivel])
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Adicionar para o espelho' }))
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('button', { name: 'Enviar' })).not.toBeInTheDocument()
    expect(espelhoApi.adicionarGuia).not.toHaveBeenCalled()
  })

  it('Ver guia (PDF) abre o visualizador somente leitura com o PDF da guia', async () => {
    vi.mocked(guiasFinalizadasApi.listar).mockResolvedValue([disponivel])
    vi.mocked(guiasFinalizadasApi.obterPdf).mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' }))
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Ver guia (PDF)' }))

    expect(await screen.findByText('Visualização somente leitura')).toBeInTheDocument()
    expect(guiasFinalizadasApi.obterPdf).toHaveBeenCalledWith(1)
  })

  it('erro ao abrir o PDF mostra a mensagem no visualizador', async () => {
    vi.mocked(guiasFinalizadasApi.listar).mockResolvedValue([disponivel])
    vi.mocked(guiasFinalizadasApi.obterPdf).mockRejectedValue(new Error('falha'))
    renderizar()

    await userEvent.click(await screen.findByRole('button', { name: 'Ver guia (PDF)' }))

    expect(await screen.findByText('Não foi possível carregar a guia.')).toBeInTheDocument()
  })

  it('erro ao carregar a lista mostra a mensagem e tenta de novo', async () => {
    vi.mocked(guiasFinalizadasApi.listar)
      .mockRejectedValueOnce(new Error('falha'))
      .mockResolvedValueOnce([])
    renderizar()

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as guias finalizadas.')
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))
    expect(await screen.findByText('Nenhuma guia finalizada até o momento.')).toBeInTheDocument()
  })
})
