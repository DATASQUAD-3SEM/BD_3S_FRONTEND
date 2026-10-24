import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { ApiError } from '../../shared/api/http'
import GuiasParaAssinarPage, { type GuiasParaAssinarPageProps } from './GuiasParaAssinarPage'
import type { AssinaturaRegistrada, GuiaParaAssinar, GuiasParaAssinarApi } from './types'

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
