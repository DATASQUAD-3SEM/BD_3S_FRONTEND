import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import GuiasParaImpressaoPage from './GuiasParaImpressaoPage'
import { imprimirIframe, imprimirUrlEmSegundoPlano } from './imprimirPdf'
import type { GuiaRecepcao, GuiasRecepcaoApi } from './types'

/**
 * Testes da tela Guias para impressao da Recepcao (T6-FE): busca, janela de visualizacao e impressao.
 */

vi.mock('./imprimirPdf', () => ({
  imprimirUrlEmSegundoPlano: vi.fn(),
  imprimirIframe: vi.fn(),
}))

const GUIAS: GuiaRecepcao[] = [
  {
    guiaId: 2,
    numero: '202610655',
    beneficiarioNome: 'Antonio Carlos Ferreira',
    precCp: '45872213300',
    ocsNome: 'Laboratório Exemplo',
    validadeAte: '2026-11-20',
  },
  {
    guiaId: 1,
    numero: '202610701',
    beneficiarioNome: 'Antonio Carlos Ferreira',
    precCp: '45872213300',
    ocsNome: 'Hospital Exemplo',
    validadeAte: '2026-12-01',
  },
]

function criarApi(sobrescrever: Partial<GuiasRecepcaoApi> = {}): GuiasRecepcaoApi {
  return {
    buscar: vi.fn(async () => GUIAS),
    obterPdf: vi.fn(async () => new Blob(['%PDF'], { type: 'application/pdf' })),
    ...sobrescrever,
  }
}

const campoBusca = () => screen.getByLabelText('Nome do beneficiário, Prec CP ou número da Guia')

beforeEach(() => {
  Object.assign(URL, {
    createObjectURL: vi.fn(() => 'blob:teste'),
    revokeObjectURL: vi.fn(),
  })
})

afterEach(() => {
  vi.clearAllMocks()
})

describe('GuiasParaImpressaoPage', () => {
  it('mostra o estado inicial e a nota fixa', () => {
    render(<GuiasParaImpressaoPage api={criarApi()} />)

    expect(screen.getByText('Digite para buscar uma Guia')).toBeInTheDocument()
    expect(
      screen.getByText('Aparecem apenas Guias Concluídas, com as duas assinaturas.'),
    ).toBeInTheDocument()
  })

  it('busca pelo botão e mostra a lista formatada', async () => {
    const api = criarApi()
    render(<GuiasParaImpressaoPage api={api} />)

    await userEvent.type(campoBusca(), 'Antonio')
    await userEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(await screen.findByText('202610655')).toBeInTheDocument()
    expect(api.buscar).toHaveBeenCalledWith('Antonio')
    expect(screen.getAllByText('458722133-00')).toHaveLength(2)
    expect(screen.getByText('20/11/2026')).toBeInTheDocument()
  })

  it('Enter no campo tambem dispara a busca', async () => {
    const api = criarApi()
    render(<GuiasParaImpressaoPage api={api} />)

    await userEvent.type(campoBusca(), 'Antonio{Enter}')

    expect(await screen.findByText('202610701')).toBeInTheDocument()
    expect(api.buscar).toHaveBeenCalledWith('Antonio')
  })

  it('nao busca com menos de 3 caracteres', async () => {
    const api = criarApi()
    render(<GuiasParaImpressaoPage api={api} />)

    await userEvent.type(campoBusca(), 'An{Enter}')

    expect(await screen.findByRole('alert')).toHaveTextContent('Digite pelo menos 3 caracteres')
    expect(api.buscar).not.toHaveBeenCalled()
  })

  it('mostra mensagem quando nao ha resultado', async () => {
    render(<GuiasParaImpressaoPage api={criarApi({ buscar: vi.fn(async () => []) })} />)

    await userEvent.type(campoBusca(), 'Zezinho{Enter}')

    expect(await screen.findByText('Nenhuma Guia encontrada')).toBeInTheDocument()
  })

  it('erro na busca mostra Tentar novamente que refaz a consulta', async () => {
    const api = criarApi({
      buscar: vi
        .fn()
        .mockRejectedValueOnce(new Error('falhou'))
        .mockResolvedValueOnce(GUIAS),
    })
    render(<GuiasParaImpressaoPage api={api} />)

    await userEvent.type(campoBusca(), 'Antonio{Enter}')
    await userEvent.click(await screen.findByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('202610701')).toBeInTheDocument()
    expect(api.buscar).toHaveBeenCalledTimes(2)
  })

  it('Visualizar abre o modal com o PDF; Esc fecha e devolve o foco ao botao', async () => {
    const api = criarApi()
    render(<GuiasParaImpressaoPage api={api} />)
    await userEvent.type(campoBusca(), 'Antonio{Enter}')

    const botoes = await screen.findAllByRole('button', { name: 'Visualizar' })
    await userEvent.click(botoes[1])

    const dialogo = await screen.findByRole('dialog', {
      name: 'Guia de encaminhamento · 202610701',
    })
    expect(within(dialogo).getByText('Pré-visualização do PDF da Guia')).toBeInTheDocument()
    expect(within(dialogo).getByRole('button', { name: 'Fechar' })).toBeInTheDocument()
    expect(await within(dialogo).findByTitle('PDF da Guia 202610701')).toBeInTheDocument()
    expect(api.obterPdf).toHaveBeenCalledWith(1, 'visualizar')

    await userEvent.keyboard('{Escape}')

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(botoes[1]).toHaveFocus()
  })

  it('botao Fechar do modal tambem fecha a janela', async () => {
    render(<GuiasParaImpressaoPage api={criarApi()} />)
    await userEvent.type(campoBusca(), 'Antonio{Enter}')

    await userEvent.click((await screen.findAllByRole('button', { name: 'Visualizar' }))[0])
    const dialogo = await screen.findByRole('dialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Fechar' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('Imprimir do modal chama a impressao do iframe', async () => {
    render(<GuiasParaImpressaoPage api={criarApi()} />)
    await userEvent.type(campoBusca(), 'Antonio{Enter}')

    await userEvent.click((await screen.findAllByRole('button', { name: 'Visualizar' }))[0])
    const dialogo = await screen.findByRole('dialog')
    await within(dialogo).findByTitle('PDF da Guia 202610655')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Imprimir' }))

    expect(imprimirIframe).toHaveBeenCalled()
  })

  it('Imprimir da lista busca o PDF no modo imprimir e dispara a impressao', async () => {
    const api = criarApi()
    render(<GuiasParaImpressaoPage api={api} />)
    await userEvent.type(campoBusca(), 'Antonio{Enter}')

    const botoes = await screen.findAllByRole('button', { name: 'Imprimir' })
    await userEvent.click(botoes[0])

    await waitFor(() => expect(imprimirUrlEmSegundoPlano).toHaveBeenCalledWith('blob:teste'))
    expect(api.obterPdf).toHaveBeenCalledWith(2, 'imprimir')
  })

  it('Baixar PDF do modal pede o modo baixar', async () => {
    const api = criarApi()
    const cliqueLink = vi
      .spyOn(HTMLAnchorElement.prototype, 'click')
      .mockImplementation(() => {})
    render(<GuiasParaImpressaoPage api={api} />)
    await userEvent.type(campoBusca(), 'Antonio{Enter}')

    await userEvent.click((await screen.findAllByRole('button', { name: 'Visualizar' }))[0])
    const dialogo = await screen.findByRole('dialog')
    await userEvent.click(within(dialogo).getByRole('button', { name: 'Baixar PDF' }))

    await waitFor(() => expect(cliqueLink).toHaveBeenCalled())
    expect(api.obterPdf).toHaveBeenCalledWith(2, 'baixar')
    cliqueLink.mockRestore()
  })
})
