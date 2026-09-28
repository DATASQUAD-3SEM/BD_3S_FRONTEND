import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RevisaoResumo from './RevisaoResumo'
import { formVazio, type NovaPreGuiaForm } from '../types'

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => vi.unstubAllGlobals())

describe('RevisaoResumo', () => {
  it('mostra avisos quando nada foi preenchido ainda', () => {
    render(<RevisaoResumo form={formVazio} />)

    expect(
      screen.getByText('Os dados do beneficiario ainda nao foram totalmente preenchidos.'),
    ).toBeInTheDocument()
    expect(screen.getByText('Nenhuma OCS selecionada ainda.')).toBeInTheDocument()
    expect(screen.getByText('Nenhum arquivo anexado ainda.')).toBeInTheDocument()
  })

  it('mostra os dados do beneficiario quando preenchidos', () => {
    const form: NovaPreGuiaForm = {
      ...formVazio,
      beneficiario: {
        nome: 'Maria Silva', idade: '40', precCp: '123',
        cpf: '111.222.333-44', telefone: '11999999999',
      },
    }
    render(<RevisaoResumo form={form} />)

    expect(screen.getByText(/Maria Silva/)).toBeInTheDocument()
    expect(screen.getByText(/111\.222\.333-44/)).toBeInTheDocument()
    expect(screen.getByText(/Idade:\s*40/)).toBeInTheDocument()
    expect(screen.getByText(/Prec-CP:\s*123/)).toBeInTheDocument()
    expect(screen.getByText(/Telefone:\s*11999999999/)).toBeInTheDocument()
  })

  it('busca e mostra o nome da OCS escolhida', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respostaJson([
        {
          id: 1, contratoNum: 'c1', nome: 'OCS Exemplo', tipo: null,
          inicioVigencia: null, terminoVigencia: null, diasParaVencimento: null,
        },
      ]),
    )
    vi.stubGlobal('fetch', fetchMock)

    const form: NovaPreGuiaForm = { ...formVazio, ocsId: 1 }
    render(<RevisaoResumo form={form} />)

    expect(await screen.findByText('OCS Exemplo')).toBeInTheDocument()
  })

  it('mostra o nome do arquivo anexado', () => {
    const arquivo = new File(['conteudo'], 'encaminhamento.pdf', { type: 'application/pdf' })
    const form: NovaPreGuiaForm = { ...formVazio, arquivo }

    render(<RevisaoResumo form={form} />)

    expect(screen.getByText('encaminhamento.pdf', { exact: false })).toBeInTheDocument()
  })

  it('não quebra a tela quando a API de OCS falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const form: NovaPreGuiaForm = { ...formVazio, ocsId: 5 }
    render(<RevisaoResumo form={form} />)

    expect(await screen.findByText(/OCS #5/)).toBeInTheDocument()
  })

  it('não possui campos editáveis (somente leitura)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson([])))

    const form: NovaPreGuiaForm = {
      ...formVazio,
      beneficiario: { nome: 'Maria', idade: '30', precCp: '123', cpf: '111', telefone: '999' },
      ocsId: 1,
      arquivo: new File(['x'], 'foto.png', { type: 'image/png' }),
    }
    render(<RevisaoResumo form={form} />)

    await screen.findByText(/OCS #1/)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
