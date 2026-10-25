import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BeneficiarioProvider } from '../../beneficiario/BeneficiarioContext'
import NovaPreGuiaPage from '.'

/**
 * Testes da Nova pre-guia do beneficiario: carregamento, escolha de OCS e arquivo e envio ao backend.
 */

function json(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
}

const beneficiario = {
  nome: 'Antonio Carlos',
  cpf: '12345678900',
  precCp: '45872213300',
  telefone: '12987654321',
  dataNascimento: '1978-05-10',
  grupo: 'Exército Brasileiro · FUSEX',
  assinaturaCadastrada: false,
}

const ocs = { id: 2, nome: 'Hospital Exemplo', contrato: 'EXEMPLO-002', tipo: 'PSA' }

let fetchMock: ReturnType<typeof vi.fn>

function renderNovaPreGuia() {
  return render(
    <MemoryRouter>
      <BeneficiarioProvider>
        <NovaPreGuiaPage />
      </BeneficiarioProvider>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:falso')
  URL.revokeObjectURL = vi.fn()

  fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    if (url === '/api/beneficiarios/me') return Promise.resolve(json(beneficiario))
    if (url.startsWith('/api/beneficiarios/me/ocs')) return Promise.resolve(json([ocs]))
    if (url === '/api/pre-guias' && init?.method === 'POST') {
      return Promise.resolve(
        json({ id: 7, numero: '0007', status: 'PENDENTE', dataCriacao: '2026-10-25T10:00:00', ocsId: 2 }, 201),
      )
    }
    return Promise.resolve(new Response('', { status: 404 }))
  })
  vi.stubGlobal('fetch', fetchMock)
})

afterEach(() => vi.unstubAllGlobals())

describe('NovaPreGuiaPage', () => {
  it('renderiza o container com todos os componentes', async () => {
    renderNovaPreGuia()

    expect(await screen.findByText('Antonio Carlos')).toBeInTheDocument()
    expect(screen.getByText('123.456.789-00')).toBeInTheDocument()
    expect(screen.getByText('Revisão da pré-guia')).toBeInTheDocument()
    expect(screen.getByText('Encaminhamento médico')).toBeInTheDocument()
    expect(await screen.findByText('Hospital Exemplo')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /Enviar pré-guia/i })).toBeDisabled()
    expect(screen.getByText(/Para enviar, falta preencher/i)).toBeInTheDocument()
  })

  it('o arquivo escolhido passa pelo container e volta como preview', async () => {
    renderNovaPreGuia()
    await screen.findByText('Antonio Carlos')

    const foto = new File(['x'], 'encaminhamento.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Selecionar arquivo do encaminhamento'), {
      target: { files: [foto] },
    })

    expect(screen.getAllByText('encaminhamento.png').length).toBeGreaterThan(0)
    expect(screen.getByText(/Arquivo pronto para envio/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Remover e enviar outro arquivo/ }))
    expect(screen.getByRole('button', { name: /Escolher Arquivo/ })).toBeInTheDocument()
  })

  it('arquivo com formato inválido mostra erro', async () => {
    renderNovaPreGuia()
    await screen.findByText('Antonio Carlos')

    const txt = new File(['oi'], 'nota.txt', { type: 'text/plain' })
    fireEvent.change(screen.getByLabelText('Selecionar arquivo do encaminhamento'), {
      target: { files: [txt] },
    })

    expect(screen.getByRole('alert')).toHaveTextContent(/Formato inválido/i)
  })

  it('envia a pré-guia ao backend e limpa o formulário', async () => {
    renderNovaPreGuia()
    await screen.findByText('Antonio Carlos')

    fireEvent.click(await screen.findByRole('radio'))
    fireEvent.change(screen.getByLabelText('Selecionar arquivo do encaminhamento'), {
      target: { files: [new File(['%PDF'], 'encaminhamento.pdf', { type: 'application/pdf' })] },
    })

    const enviar = screen.getByRole('button', { name: /Enviar pré-guia/i })
    expect(enviar).toBeEnabled()
    fireEvent.click(enviar)

    expect(await screen.findByText(/Pré-guia 0007 enviada ao setor de Guias/)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Ver Minhas pré-guias' })).toHaveAttribute('href', '/pre-guias')

    const chamada = fetchMock.mock.calls.find(([url]) => url === '/api/pre-guias')
    const corpo = chamada?.[1]?.body as FormData
    expect(corpo.get('ocsId')).toBe('2')
    await waitFor(() => expect(screen.getByText('Nenhuma OCS selecionada ainda.')).toBeInTheDocument())
  })

  it('mostra a mensagem do backend quando o envio falha', async () => {
    fetchMock.mockImplementation((url: string, init?: RequestInit) => {
      if (url === '/api/beneficiarios/me') return Promise.resolve(json(beneficiario))
      if (url.startsWith('/api/beneficiarios/me/ocs')) return Promise.resolve(json([ocs]))
      if (url === '/api/pre-guias' && init?.method === 'POST') {
        return Promise.resolve(json({ status: 422, erro: 'Unprocessable Entity', mensagem: 'OCS inexistente ou inativa', detalhes: [] }, 422))
      }
      return Promise.resolve(new Response('', { status: 404 }))
    })
    renderNovaPreGuia()
    await screen.findByText('Antonio Carlos')

    fireEvent.click(await screen.findByRole('radio'))
    fireEvent.change(screen.getByLabelText('Selecionar arquivo do encaminhamento'), {
      target: { files: [new File(['%PDF'], 'encaminhamento.pdf', { type: 'application/pdf' })] },
    })
    fireEvent.click(screen.getByRole('button', { name: /Enviar pré-guia/i }))

    expect(await screen.findByText('OCS inexistente ou inativa')).toBeInTheDocument()
  })
})
