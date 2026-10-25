import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import NovaPreGuiaMedicoPage from '.'

const medicoMock = { nome: 'Ribeiro', patente: 'Cap Méd', crm: '000.000-SP' }

const beneficiarioMock = {
  id: 7,
  nome: 'Antonio Carlos Ferreira',
  grupo: 'Exército Brasileiro · FUSEX',
  faixaEtaria: '51 a 60',
  idade: 58,
  cpf: '52998224725',
  telefone: '12987654321',
}

const ocsMock = { id: 1, nome: 'Laboratório Exemplo', contrato: 'EXEMPLO-001', tipo: 'LABORATORIO' }
const procedimentoMock = { codigoTuss: '40304361', nome: 'Hemograma completo' }

function respostaJson(corpo: unknown, status = 200): Promise<Response> {
  return Promise.resolve(
    new Response(JSON.stringify(corpo), {
      status,
      headers: { 'Content-Type': 'application/json' },
    }),
  )
}

type Personalizada = (url: string, init?: RequestInit) => Promise<Response> | undefined

/** Respostas padrão da tela. `personalizada` pode sobrescrever qualquer chamada. */
function fetchFalso(personalizada: Personalizada = () => undefined) {
  return vi.fn((url: string, init?: RequestInit) => {
    const sobrescrita = personalizada(url, init)
    if (sobrescrita) return sobrescrita

    if (url === '/api/medicos/me') return respostaJson(medicoMock)
    if (url.startsWith('/api/ocs')) return respostaJson({ resultados: [ocsMock], total: 1 })
    if (url.startsWith('/api/medicos/procedimentos')) return respostaJson([procedimentoMock])
    if (url.startsWith('/api/medicos/beneficiarios')) return respostaJson(beneficiarioMock)

    return respostaJson({ mensagem: 'Rota não mockada' }, 404)
  })
}

beforeEach(() => {
  vi.stubGlobal('fetch', fetchFalso())
})

afterEach(() => {
  vi.unstubAllGlobals()
})

function preencherPrecCp(valor: string) {
  fireEvent.change(screen.getByLabelText('Prec CP'), { target: { value: valor } })
}

async function preencherFormularioCompleto() {
  preencherPrecCp('45872213300')
  fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))
  await screen.findByText('Antonio Carlos Ferreira')

  fireEvent.click(await screen.findByRole('button', { name: /Laboratório Exemplo/ }))

  fireEvent.change(screen.getByLabelText('Buscar por nome ou código TUSS'), {
    target: { value: 'hemo' },
  })
  fireEvent.click(await screen.findByRole('button', { name: /Hemograma completo/ }))
}

describe('NovaPreGuiaMedicoPage', () => {
  it('mostra o médico solicitante, a lista inicial de OCS e o aviso de OCS não escolhida', async () => {
    render(<NovaPreGuiaMedicoPage />)

    expect(await screen.findByText('Cap Méd Ribeiro')).toBeInTheDocument()
    expect(screen.getByText('Preenchido automaticamente com seu perfil.')).toBeInTheDocument()
    expect(await screen.findByRole('button', { name: /Laboratório Exemplo/ })).toBeInTheDocument()
    expect(
      screen.getByText('Nenhuma OCS selecionada. Escolha uma das opções da lista.'),
    ).toBeInTheDocument()
  })

  it('busca o beneficiário com Prec CP mascarado e mostra o card somente leitura', async () => {
    render(<NovaPreGuiaMedicoPage />)

    preencherPrecCp('45872213300')
    expect(screen.getByLabelText('Prec CP')).toHaveValue('458722133-00')

    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(await screen.findByText('Antonio Carlos Ferreira')).toBeInTheDocument()
    expect(screen.getByText('51 a 60 (58 anos)')).toBeInTheDocument()
    expect(screen.getByText('529.982.247-25')).toBeInTheDocument()
    expect(fetch).toHaveBeenCalledWith(
      '/api/medicos/beneficiarios?precCp=45872213300',
      expect.anything(),
    )
  })

  it('mostra "Beneficiário não encontrado" quando a API responde 404', async () => {
    vi.stubGlobal(
      'fetch',
      fetchFalso((url) =>
        url.startsWith('/api/medicos/beneficiarios')
          ? respostaJson({ mensagem: 'Beneficiario nao encontrado' }, 404)
          : undefined,
      ),
    )

    render(<NovaPreGuiaMedicoPage />)
    preencherPrecCp('45872213300')
    fireEvent.click(screen.getByRole('button', { name: 'Buscar' }))

    expect(await screen.findByText('Beneficiário não encontrado.')).toBeInTheDocument()
  })

  it('alterar o Prec CP limpa beneficiário, OCS e exames', async () => {
    render(<NovaPreGuiaMedicoPage />)
    await preencherFormularioCompleto()

    preencherPrecCp('4587221330')

    expect(screen.queryByText('Antonio Carlos Ferreira')).not.toBeInTheDocument()
    expect(screen.queryByText(/^OCS selecionada ·/)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Remover' })).not.toBeInTheDocument()
  })

  it('não permite enviar sem os requisitos e não repete procedimento já incluído', async () => {
    render(<NovaPreGuiaMedicoPage />)

    expect(screen.getByRole('button', { name: 'Enviar ao setor de Guias' })).toBeDisabled()

    await preencherFormularioCompleto()

    expect(await screen.findByRole('button', { name: /Já incluído/ })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Enviar ao setor de Guias' })).toBeEnabled()
  })

  it('envia a pré-guia, mostra o número e limpa o formulário', async () => {
    const fetchMock = fetchFalso((_url, init) =>
      init?.method === 'POST'
        ? respostaJson(
          { id: 12, numero: '0012', status: 'PENDENTE', dataCriacao: '2026-10-25T10:00:00' },
          201,
        )
        : undefined,
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<NovaPreGuiaMedicoPage />)
    await preencherFormularioCompleto()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar ao setor de Guias' }))

    expect(
      await screen.findByText('Pré-guia 0012 enviada ao setor de Guias'),
    ).toBeInTheDocument()
    expect(screen.getByLabelText('Prec CP')).toHaveValue('')

    const chamadaPost = fetchMock.mock.calls.find(([, init]) => init?.method === 'POST')
    expect(JSON.parse(String(chamadaPost?.[1]?.body))).toEqual({
      beneficiarioId: 7,
      ocsId: 1,
      procedimentos: ['40304361'],
    })
  })

  it('em erro de envio, mostra a mensagem e mantém o preenchimento', async () => {
    vi.stubGlobal(
      'fetch',
      fetchFalso((_url, init) =>
        init?.method === 'POST'
          ? respostaJson(
            {
              status: 422,
              erro: 'Unprocessable Entity',
              mensagem: 'Dados invalidos',
              detalhes: ['procedimentos: Codigo TUSS inexistente no catalogo: 999'],
              timestamp: '2026-10-25T10:00:00',
            },
            422,
          )
          : undefined,
      ),
    )

    render(<NovaPreGuiaMedicoPage />)
    await preencherFormularioCompleto()

    fireEvent.click(screen.getByRole('button', { name: 'Enviar ao setor de Guias' }))

    expect(await screen.findByText('Dados invalidos')).toBeInTheDocument()
    expect(
      screen.getByText('procedimentos: Codigo TUSS inexistente no catalogo: 999'),
    ).toBeInTheDocument()
    expect(screen.getByText(/^OCS selecionada ·/)).toBeInTheDocument()
    expect(screen.getByLabelText('Prec CP')).toHaveValue('458722133-00')
  })
})
