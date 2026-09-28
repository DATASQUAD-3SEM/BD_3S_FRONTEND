import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import NovaPreGuiaPage from '.'

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:falso')
  URL.revokeObjectURL = vi.fn()
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('NovaPreGuiaPage', () => {
  it('renderiza o container com todos os componentes', async () => {
    render(<NovaPreGuiaPage />)

    expect(screen.getByText('Antonio Carlos Ferreira')).toBeInTheDocument()
    expect(screen.getByText('123.456.789-00')).toBeInTheDocument()
    expect(screen.getByText('Revisão da pré-guia')).toBeInTheDocument()
    expect(screen.getByText('Encaminhamento médico')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /Enviar pre-guia/i })).toBeDisabled()
    expect(screen.getByText(/Para enviar, falta preencher/i)).toBeInTheDocument()

    await screen.findByText(/Nenhuma OCS encontrada/i)
  })

  it('o arquivo escolhido passa pelo container e volta como preview', async () => {
    render(<NovaPreGuiaPage />)
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
    render(<NovaPreGuiaPage />)
    await screen.findByText(/Nenhuma OCS encontrada/i)

    const txt = new File(['oi'], 'nota.txt', { type: 'text/plain' })
    fireEvent.change(screen.getByLabelText('Selecionar arquivo do encaminhamento'), {
      target: { files: [txt] },
    })

    expect(screen.getByRole('alert')).toHaveTextContent(/Formato inválido/i)
  })
})
