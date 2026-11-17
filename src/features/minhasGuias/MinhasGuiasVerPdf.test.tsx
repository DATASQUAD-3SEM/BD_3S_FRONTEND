import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import MinhasGuiasPage from './MinhasGuiasPage'
import type { GuiaDoBeneficiario } from './types'

// T23-FE1: botao "Ver guia (PDF)" em todo cartao, PDF pelo id da guia (GET /guias/{id}/pdf) e estados do visualizador.

const URL_PDF_NAO_ENVIADA = '/api/guias/6/pdf'
const URL_PDF_VENCIDA = '/api/guias/1/pdf'

const guias: GuiaDoBeneficiario[] = [
  {
    id: 6, numero: '202610706', ocs: 'Laboratório Exemplo',
    validadeAte: '2026-12-28', dataEnvio: null, situacao: 'NAO_ENVIADA',
    procedimentos: [{ codDgp: '40304361', descricao: 'Hemograma completo', quantidade: 2 }],
    sessoes: [],
  },
  {
    id: 1, numero: '202610701', ocs: 'Hospital Exemplo',
    validadeAte: '2026-10-15', dataEnvio: '2026-09-01T10:00:00', situacao: 'VENCIDA',
    procedimentos: [{ codDgp: '40301630', descricao: 'Glicose', quantidade: 1 }],
    sessoes: [{ id: 101, procedimento: '40301630', numero: 1, status: 'EXPIRADA', dataSolicitacao: null, dataAssinatura: null }],
  },
]

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

// Responde a lista e ao PDF. O PDF pode ser: 'ok', 'erro' (500) ou 'pendente' (nunca resolve).
function stubbearComPdf(modoPdf: 'ok' | 'erro' | 'pendente' = 'ok') {
  const fetchMock = vi.fn().mockImplementation((url: string) => {
    if (url === '/api/guias/minhas') {
      return Promise.resolve(respostaJson(guias))
    }
    if (url === URL_PDF_NAO_ENVIADA || url === URL_PDF_VENCIDA) {
      if (modoPdf === 'pendente') return new Promise<Response>(() => {})
      if (modoPdf === 'erro') return Promise.resolve(new Response('', { status: 500 }))
      return Promise.resolve(
        new Response('%PDF-1.4 mock', { status: 200, headers: { 'Content-Type': 'application/pdf' } }),
      )
    }
    return Promise.resolve(new Response('', { status: 404 }))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const chamadasPdf = (fetchMock: ReturnType<typeof vi.fn>, url: string) =>
  fetchMock.mock.calls.filter(([u]) => u === url)

const cartaoDe = (numero: string) => screen.getByLabelText(`Guia nº ${numero}`)

beforeEach(() => {
  localStorage.clear()
  URL.createObjectURL = vi.fn(() => 'blob:mock-pdf')
  URL.revokeObjectURL = vi.fn()
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('T23-FE1 · Ver guia (PDF) em Minhas guias', () => {
  it('mostra o botão Ver guia (PDF) em todo cartão', async () => {
    stubbearComPdf()
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610706')

    expect(screen.getAllByRole('button', { name: 'Ver guia (PDF)' })).toHaveLength(2)
  })

  it('abre o PDF pelo id da guia', async () => {
    const fetchMock = stubbearComPdf()
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610706')

    await userEvent.click(within(cartaoDe('202610706')).getByRole('button', { name: 'Ver guia (PDF)' }))

    expect(await screen.findByTitle('PDF da guia 202610706')).toBeInTheDocument()
    expect(chamadasPdf(fetchMock, URL_PDF_NAO_ENVIADA)).toHaveLength(1)
  })

  it('guia Vencida também abre o PDF, sem aviso extra', async () => {
    const fetchMock = stubbearComPdf()
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610701')

    await userEvent.click(within(cartaoDe('202610701')).getByRole('button', { name: 'Ver guia (PDF)' }))

    expect(await screen.findByTitle('PDF da guia 202610701')).toBeInTheDocument()
    expect(chamadasPdf(fetchMock, URL_PDF_VENCIDA)).toHaveLength(1)
  })

  it('enquanto o PDF carrega, mostra "Carregando guia…"', async () => {
    stubbearComPdf('pendente')
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610706')

    await userEvent.click(within(cartaoDe('202610706')).getByRole('button', { name: 'Ver guia (PDF)' }))

    expect(await screen.findByText('Carregando guia…')).toBeInTheDocument()
  })

  it('se o PDF falha, mostra "Não foi possível carregar a guia."', async () => {
    stubbearComPdf('erro')
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610706')

    await userEvent.click(within(cartaoDe('202610706')).getByRole('button', { name: 'Ver guia (PDF)' }))

    expect(await screen.findByText('Não foi possível carregar a guia.')).toBeInTheDocument()
  })

  it('fechar e abrir de novo busca o PDF outra vez (sem cache)', async () => {
    const fetchMock = stubbearComPdf()
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610706')
    const botao = within(cartaoDe('202610706')).getByRole('button', { name: 'Ver guia (PDF)' })

    await userEvent.click(botao)
    await screen.findByTitle('PDF da guia 202610706')
    await userEvent.click(within(cartaoDe('202610706')).getByRole('button', { name: 'Fechar guia' }))
    await waitFor(() => expect(screen.queryByTitle('PDF da guia 202610706')).not.toBeInTheDocument())

    await userEvent.click(botao)
    await screen.findByTitle('PDF da guia 202610706')

    expect(chamadasPdf(fetchMock, URL_PDF_NAO_ENVIADA)).toHaveLength(2)
  })
})
