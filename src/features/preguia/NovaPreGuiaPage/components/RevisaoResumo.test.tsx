import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RevisaoResumo from './RevisaoResumo'
import { formVazio, type NovaPreGuiaForm } from '../types'

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
}

afterEach(() => vi.unstubAllGlobals())

describe('RevisaoResumo', () => {
  it('mostra avisos quando nada foi preenchido ainda', () => {
    render(<RevisaoResumo form={formVazio} />)

    expect(screen.getByText('Os dados do beneficiario ainda nao foram totalmente preenchidos.')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma OCS selecionada ainda.')).toBeInTheDocument()
    expect(screen.getByText('Nenhum procedimento selecionado ainda.')).toBeInTheDocument()
    expect(screen.getByText('Nenhum arquivo anexado ainda.')).toBeInTheDocument()
  })

  it('mostra os dados do beneficiario quando preenchidos', () => {
    const form: NovaPreGuiaForm = {
      ...formVazio,
      beneficiario: { nome: 'Maria Silva', idade: '40', precCp: '123', cpf: '111.222.333-44', telefone: '11999999999' },
    }
    render(<RevisaoResumo form={form} />)

    // Cada <li> tem o rotulo junto do valor (ex.: "Nome: Maria Silva").
    // Por isso usamos regex para achar o valor dentro do texto maior.
    expect(screen.getByText(/Maria Silva/)).toBeInTheDocument()
    expect(screen.getByText(/111\.222\.333-44/)).toBeInTheDocument()
    expect(screen.getByText(/Idade:\s*40/)).toBeInTheDocument()
    expect(screen.getByText(/Prec-CP:\s*123/)).toBeInTheDocument()
    expect(screen.getByText(/Telefone:\s*11999999999/)).toBeInTheDocument()
  })

  it('busca e mostra o nome da OCS e dos procedimentos escolhidos', async () => {
    const fetchMock = vi.fn((url: string) => {
      if (url.includes('/ocs/1/procedimentos')) {
        return Promise.resolve(
          respostaJson([{ id: 10, codigoTuss: 'x', terminologiaProcedimentoEvento: 'Hemograma', grupo: null, subgrupo: null, capitulo: null }]),
        )
      }
      return Promise.resolve(
        respostaJson([{ id: 1, contratoNum: 'c1', nome: 'OCS Exemplo', tipo: null, inicioVigencia: null, terminoVigencia: null, diasParaVencimento: null }]),
      )
    })
    vi.stubGlobal('fetch', fetchMock)

    const form: NovaPreGuiaForm = { ...formVazio, ocsId: 1, procedimentoIds: [10] }
    render(<RevisaoResumo form={form} />)

    expect(await screen.findByText('OCS Exemplo')).toBeInTheDocument()
    expect(await screen.findByText('Hemograma')).toBeInTheDocument()
  })

  it('mostra o nome do arquivo anexado quando nao e imagem', () => {
    const arquivo = new File(['conteudo'], 'encaminhamento.pdf', { type: 'application/pdf' })
    const form: NovaPreGuiaForm = { ...formVazio, arquivo }

    render(<RevisaoResumo form={form} />)

    expect(screen.getByText('encaminhamento.pdf', { exact: false })).toBeInTheDocument()
  })

  it('nao quebra a tela quando a API de OCS falha (backend ainda nao existe)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const form: NovaPreGuiaForm = { ...formVazio, ocsId: 5 }
    render(<RevisaoResumo form={form} />)

    expect(await screen.findByText(/OCS #5/)).toBeInTheDocument()
  })

  it('nao possui campos editaveis (somente leitura)', async () => {
    // Stub do fetch para as chamadas de OCS/procedimentos terminarem rapido
    // e nao dispararem o aviso "act(...)".
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(respostaJson([])),
    )

    const form: NovaPreGuiaForm = {
      ...formVazio,
      beneficiario: { nome: 'Maria', idade: '30', precCp: '123', cpf: '111', telefone: '999' },
      ocsId: 1,
      procedimentoIds: [10],
      arquivo: new File(['x'], 'foto.png', { type: 'image/png' }),
    }
    render(<RevisaoResumo form={form} />)

    // Espera a chamada assincrona do useEffect terminar (isso elimina o aviso de "act").
    await screen.findByText(/OCS #1/)

    // Nenhum campo editavel / botao deve existir (somente leitura).
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
