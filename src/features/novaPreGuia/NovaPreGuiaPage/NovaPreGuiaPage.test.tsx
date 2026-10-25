import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { BeneficiarioProvider } from '../../beneficiario/BeneficiarioContext'
import NovaPreGuiaPage from '.'

/**
 * Testes da Nova pre-guia do beneficiario (Sprint 1).
 */

function renderNovaPreGuia() {
  return render(
    <BeneficiarioProvider>
      <NovaPreGuiaPage />
    </BeneficiarioProvider>,
  )
}

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:falso')
  URL.revokeObjectURL = vi.fn()

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string) => {
      if (url === '/api/beneficiarios/me') {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              nome: 'Antonio Carlos',
              cpf: '12345678900',
              precCp: '45872213300',
              telefone: '(12) 98765-4321',
              dataNascimento: '1978-05-10',
              grupo: 'Exército Brasileiro · FUSEX',
              assinaturaCadastrada: false,
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          ),
        )
      }

      if (url === '/api/ocs') {
        return Promise.resolve(
          new Response(JSON.stringify([]), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }),
        )
      }

      return Promise.resolve(new Response('', { status: 404 }))
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('NovaPreGuiaPage', () => {
  it('renderiza o container com todos os componentes', async () => {
    renderNovaPreGuia()

    expect(await screen.findByText('Antonio Carlos'),
      ).toBeInTheDocument()
    expect(screen.getByText('123.456.789-00')).toBeInTheDocument()
    expect(screen.getByText('Revisão da pré-guia')).toBeInTheDocument()
    expect(screen.getByText('Encaminhamento médico')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /Enviar pré-guia/i })).toBeDisabled()
    expect(screen.getByText(/Para enviar, falta preencher/i)).toBeInTheDocument()

    await screen.findByText(/Nenhuma OCS encontrada/i)
  })

  it('o arquivo escolhido passa pelo container e volta como preview', async () => {
    renderNovaPreGuia()
    await screen.findByText('Antonio Carlos')
    await screen.findByText(/Nenhuma OCS encontrada/i)

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
    await screen.findByText(/Nenhuma OCS encontrada/i)

    const txt = new File(['oi'], 'nota.txt', { type: 'text/plain' })
    fireEvent.change(screen.getByLabelText('Selecionar arquivo do encaminhamento'), {
      target: { files: [txt] },
    })

    expect(screen.getByRole('alert')).toHaveTextContent(/Formato inválido/i)
  })
})
