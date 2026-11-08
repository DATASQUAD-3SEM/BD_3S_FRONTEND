import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ApiError } from '../../shared/api/http'
import GuiasParaAssinarPage, { type GuiasParaAssinarPageProps } from './GuiasParaAssinarPage'
import type { AssinaturaRegistrada, GuiaParaAssinar, GuiasParaAssinarApi } from './types'

/**
 * Testes da tela Guias para assinar (T5-FE) para medico e chefe, incluindo os textos padronizados de pendencia.
 */

const GUIAS: GuiaParaAssinar[] = [
  { guiaId: 1, numero: '202610701', beneficiarioNome: 'Marta Souza Lima', pendencias: ['MEDICO', 'CHEFE'] },
  { guiaId: 2, numero: '202610699', beneficiarioNome: 'João Pereira Alves', pendencias: ['MEDICO'] },
]

const ASSINATURA_OK: AssinaturaRegistrada = { assinaturas: ['MEDICO'], concluida: false }

function criarApi(sobrescrever: Partial<GuiasParaAssinarApi> = {}): GuiasParaAssinarApi {
  return {
    listar: vi.fn(async () => GUIAS),
    obterPdf: vi.fn(async () => new Blob(['%PDF'], { type: 'application/pdf' })),
    assinar: vi.fn(async () => ASSINATURA_OK),
    assinarLote: vi.fn(async (guiaIds: number[]) => ({ assinadas: guiaIds, falhas: [] })),
    ...sobrescrever,
  }
}

function renderizar(api: GuiasParaAssinarApi, extra: Partial<GuiasParaAssinarPageProps> = {}) {
  return render(
    <MemoryRouter>
      <GuiasParaAssinarPage
        perfil="MEDICO"
        assinaturaCadastrada={true}
        identificacao="Cap Méd Ribeiro"
        linkMinhasInformacoes="/medico/minhas-informacoes"
        api={api}
        {...extra}
      />
    </MemoryRouter>,
  )
}

const botaoAssinar = () => screen.getByRole('button', { name: 'Assinar com minha assinatura' })

beforeEach(() => {
  Object.assign(URL, {
    createObjectURL: vi.fn(() => 'blob:teste'),
    revokeObjectURL: vi.fn(),
  })
})

afterEach(() => {
  vi.restoreAllMocks()
})

describe('GuiasParaAssinarPage', () => {
  it('mostra a pendência de cada Guia e seleciona a primeira', async () => {
    const api = criarApi()
    renderizar(api)

    expect(await screen.findByText('Faltam assinaturas do chefe e de um médico.')).toBeInTheDocument()
    expect(screen.getByText('Falta assinatura de um médico.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /202610701/ })).toHaveAttribute('aria-pressed', 'true')
    await waitFor(() => expect(api.obterPdf).toHaveBeenCalledWith(1, 'visualizar'))
  })

  it('no perfil chefe mostra a pendência do chefe e a nota do chefe', async () => {
    const api = criarApi({
      listar: vi.fn(async (): Promise<GuiaParaAssinar[]> => [
        { guiaId: 3, numero: '202610702', beneficiarioNome: 'Ana Lima', pendencias: ['CHEFE'] },
      ]),
    })
    renderizar(api, { perfil: 'CHEFE', linkMinhasInformacoes: '/chefe/minhas-informacoes' })

    expect(await screen.findByText('Falta assinatura do chefe.')).toBeInTheDocument()
    expect(
      screen.getByText('A Guia só fica Concluída para o beneficiário depois das duas assinaturas.'),
    ).toBeInTheDocument()
  })

  it('mostra Pendente (sua assinatura) na sua linha e Pendente na do outro papel', async () => {
    renderizar(criarApi())

    expect(await screen.findByText('Pendente (sua assinatura)')).toBeInTheDocument()
    expect(screen.getByText('Pendente')).toBeInTheDocument()
  })

  it('mostra o estado vazio quando não há Guias', async () => {
    renderizar(criarApi({ listar: vi.fn(async () => []) }))

    expect(await screen.findByText('Nenhuma Guia para assinar')).toBeInTheDocument()
  })

  it('mostra erro ao carregar e recarrega ao clicar em Tentar novamente', async () => {
    const listar = vi
      .fn()
      .mockRejectedValueOnce(new Error('falhou'))
      .mockResolvedValue(GUIAS)
    renderizar(criarApi({ listar }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar as Guias para assinar.',
    )
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByRole('button', { name: /202610701/ })).toBeInTheDocument()
  })

  it('desabilita assinar e mostra o aviso quando não há assinatura cadastrada', async () => {
    renderizar(criarApi(), { assinaturaCadastrada: false })

    await screen.findByRole('button', { name: /202610701/ })
    expect(botaoAssinar()).toBeDisabled()
    expect(screen.getByRole('link', { name: 'Minhas informações' })).toHaveAttribute(
      'href',
      '/medico/minhas-informacoes',
    )
  })

  it('desabilita assinar quando o papel do usuário já assinou a Guia', async () => {
    renderizar(
      criarApi({
        listar: vi.fn(async (): Promise<GuiaParaAssinar[]> => [
          { guiaId: 4, numero: '202610703', beneficiarioNome: 'Carlos', pendencias: ['CHEFE'] },
        ]),
      }),
    )

    await screen.findByRole('button', { name: /202610703/ })
    expect(botaoAssinar()).toBeDisabled()
  })

  it('confirma, assina, atualiza a lista e mostra a mensagem de sucesso', async () => {
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true)
    const listar = vi
      .fn()
      .mockResolvedValueOnce(GUIAS)
      .mockResolvedValueOnce([GUIAS[1]])
    const api = criarApi({ listar })
    renderizar(api)

    await userEvent.click(await screen.findByRole('button', { name: 'Assinar com minha assinatura' }))

    expect(confirmar).toHaveBeenCalledWith('Confirmar a assinatura da Guia 202610701?')
    expect(api.assinar).toHaveBeenCalledWith(1)
    expect(await screen.findByText('Assinatura registrada.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('button', { name: /202610701/ })).not.toBeInTheDocument())
  })

  it('não assina quando o usuário cancela a confirmação', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const api = criarApi()
    renderizar(api)

    await userEvent.click(await screen.findByRole('button', { name: 'Assinar com minha assinatura' }))

    expect(api.assinar).not.toHaveBeenCalled()
  })

  it('erro 409 mostra a mensagem e recarrega a lista', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const listar = vi
      .fn()
      .mockResolvedValueOnce(GUIAS)
      .mockResolvedValueOnce([GUIAS[1]])
    const api = criarApi({
      listar,
      assinar: vi
        .fn()
        .mockRejectedValue(new ApiError(409, 'Esta Guia ja foi assinada por um medico do FUSEX')),
    })
    renderizar(api)

    await userEvent.click(await screen.findByRole('button', { name: 'Assinar com minha assinatura' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esta Guia ja foi assinada por um medico do FUSEX',
    )
    await waitFor(() => expect(listar).toHaveBeenCalledTimes(2))
  })
})

// Lote do chefe: checkboxes, "Selecionar todas", barra de acao, envio { guiaIds } e respostas 200/207/erro
describe('lote do chefe (T10-FE)', () => {
  const GUIAS_CHEFE: GuiaParaAssinar[] = [
    { guiaId: 1, numero: '202610711', beneficiarioNome: 'Carla Mendes', pendencias: ['CHEFE'] },
    { guiaId: 2, numero: '202610712', beneficiarioNome: 'Paulo Dias', pendencias: ['MEDICO', 'CHEFE'] },
    { guiaId: 3, numero: '202610713', beneficiarioNome: 'Luana Costa', pendencias: ['CHEFE'] },
  ]

  const renderChefe = (api: GuiasParaAssinarApi) =>
    renderizar(api, { perfil: 'CHEFE', linkMinhasInformacoes: '/chefe/minhas-informacoes' })

  const checkbox = (numero: string) => screen.getByRole('checkbox', { name: `Selecionar Guia ${numero}` })

  beforeEach(() => {
    vi.spyOn(window, 'confirm').mockReturnValue(true)
  })

  it('mostra um checkbox por cartão e o mestre marca e desmarca todas', async () => {
    renderChefe(criarApi({ listar: vi.fn(async () => GUIAS_CHEFE) }))

    await screen.findByRole('button', { name: /202610711/ })
    expect(checkbox('202610711')).not.toBeChecked()
    expect(checkbox('202610712')).not.toBeChecked()

    await userEvent.click(screen.getByRole('checkbox', { name: 'Selecionar todas' }))
    expect(checkbox('202610711')).toBeChecked()
    expect(checkbox('202610712')).toBeChecked()
    expect(checkbox('202610713')).toBeChecked()

    await userEvent.click(checkbox('202610712'))
    expect(screen.getByRole('checkbox', { name: 'Selecionar todas' })).not.toBeChecked()
  })

  it('a barra aparece com a seleção, mostra o contador e some ao limpar', async () => {
    renderChefe(criarApi({ listar: vi.fn(async () => GUIAS_CHEFE) }))

    await screen.findByRole('button', { name: /202610711/ })
    expect(screen.queryByRole('region', { name: 'Ação em lote' })).not.toBeInTheDocument()

    await userEvent.click(checkbox('202610711'))
    const barra = screen.getByRole('region', { name: 'Ação em lote' })
    expect(barra).toHaveTextContent('1 guia(s) selecionada(s)')

    await userEvent.click(screen.getByRole('button', { name: 'Limpar seleção' }))
    expect(screen.queryByRole('region', { name: 'Ação em lote' })).not.toBeInTheDocument()
    expect(checkbox('202610711')).not.toBeChecked()
  })

  it('clicar no checkbox não abre o detalhe da Guia', async () => {
    const api = criarApi({ listar: vi.fn(async () => GUIAS_CHEFE) })
    renderChefe(api)

    await screen.findByRole('button', { name: /202610711/ })
    await userEvent.click(checkbox('202610712'))

    expect(screen.getByRole('button', { name: /202610711/ })).toHaveAttribute('aria-pressed', 'true')
    expect(api.obterPdf).not.toHaveBeenCalledWith(2, 'visualizar')
  })

  it('desabilita o botão e avisa quando há mais de 50 guias selecionadas', async () => {
    const muitas: GuiaParaAssinar[] = Array.from({ length: 51 }, (_, i) => ({
      guiaId: i + 1,
      numero: `2026${String(i + 1).padStart(5, '0')}`,
      beneficiarioNome: `Beneficiário ${i + 1}`,
      pendencias: ['CHEFE' as const],
    }))
    renderChefe(criarApi({ listar: vi.fn(async () => muitas) }))

    await screen.findByRole('button', { name: /202600001/ })
    await userEvent.click(screen.getByRole('checkbox', { name: 'Selecionar todas' }))

    expect(screen.getByText('Selecione até 50 guias por vez.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Assinar selecionadas' })).toBeDisabled()
  })

  it('envia o lote no formato { guiaIds } com as guias selecionadas', async () => {
    const api = criarApi({ listar: vi.fn(async () => GUIAS_CHEFE) })
    renderChefe(api)

    await screen.findByRole('button', { name: /202610711/ })
    await userEvent.click(checkbox('202610711'))
    await userEvent.click(checkbox('202610713'))
    await userEvent.click(screen.getByRole('button', { name: 'Assinar selecionadas' }))

    expect(api.assinarLote).toHaveBeenCalledWith([1, 3])
  })

  it('200 remove as guias da lista e da seleção e mostra a mensagem de sucesso', async () => {
    const listar = vi.fn().mockResolvedValueOnce(GUIAS_CHEFE).mockResolvedValue([GUIAS_CHEFE[1]])
    renderChefe(criarApi({ listar }))

    await screen.findByRole('button', { name: /202610711/ })
    await userEvent.click(checkbox('202610711'))
    await userEvent.click(checkbox('202610713'))
    await userEvent.click(screen.getByRole('button', { name: 'Assinar selecionadas' }))

    expect(await screen.findByText('2 guia(s) assinada(s) com sucesso.')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('button', { name: /202610711/ })).not.toBeInTheDocument())
    expect(screen.queryByRole('region', { name: 'Ação em lote' })).not.toBeInTheDocument()
  })

  it('207 mantém as falhas selecionadas com o motivo e remove a já assinada pelo chefe', async () => {
    // Depois do lote, a guia 3 (ja assinada pelo chefe) sai do servidor; a guia 2 continua pendente
    const listar = vi.fn().mockResolvedValueOnce(GUIAS_CHEFE).mockResolvedValue([GUIAS_CHEFE[1]])
    const api = criarApi({
      listar,
      assinarLote: vi.fn(async () => ({
        assinadas: [1],
        falhas: [
          { guiaId: 3, motivo: 'ja_assinada_pelo_chefe' },
          { guiaId: 2, motivo: 'guia_nao_encontrada' },
        ],
      })),
    })
    renderChefe(api)

    await screen.findByRole('button', { name: /202610711/ })
    await userEvent.click(checkbox('202610711'))
    await userEvent.click(checkbox('202610712'))
    await userEvent.click(checkbox('202610713'))
    await userEvent.click(screen.getByRole('button', { name: 'Assinar selecionadas' }))

    expect(
      await screen.findByText(
        '1 assinada(s). Guia 202610713: já assinada pelo chefe do FUSEX. Ela saiu da sua lista. 1 com falha continua(m) selecionada(s).',
      ),
    ).toBeInTheDocument()
    expect(screen.getByText('Falhou: guia_nao_encontrada')).toBeInTheDocument()
    await waitFor(() => expect(screen.queryByRole('button', { name: /202610713/ })).not.toBeInTheDocument())
    expect(checkbox('202610712')).toBeChecked()
  })

  it.each([
    [400, 'A seleção não pôde ser enviada. Atualize a lista e tente de novo.'],
    [403, 'Seu perfil não tem permissão para assinar em lote.'],
    [429, 'Muitas tentativas em pouco tempo. Aguarde um instante.'],
    [500, 'Erro no servidor. Sua seleção foi mantida.'],
  ])('erro %i mantém a seleção e oferece tentar novamente', async (status, mensagem) => {
    renderChefe(
      criarApi({
        listar: vi.fn(async () => GUIAS_CHEFE),
        assinarLote: vi.fn().mockRejectedValue(new ApiError(status, 'erro')),
      }),
    )

    await screen.findByRole('button', { name: /202610711/ })
    await userEvent.click(checkbox('202610711'))
    await userEvent.click(screen.getByRole('button', { name: 'Assinar selecionadas' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(mensagem)
    expect(checkbox('202610711')).toBeChecked()
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeInTheDocument()
  })

  it('o médico não vê checkboxes de lote', async () => {
    renderizar(criarApi())

    await screen.findByRole('button', { name: /202610701/ })
    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })
})
