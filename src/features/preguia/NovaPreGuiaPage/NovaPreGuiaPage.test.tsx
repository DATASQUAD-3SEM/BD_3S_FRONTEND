import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import NovaPreGuiaPage from '.'

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:falso')
  URL.revokeObjectURL = vi.fn()
  // SelecaoOcs agora busca /ocs no mount — evita rede real no teste.
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

    // Ainda é EmConstrucao. Quando alguém implementar, REMOVA o nome da lista.
    expect(screen.getByText('FeedbackUpload')).toBeInTheDocument()

    // DadosBeneficiario foi implementado: os campos aparecem.
    expect(screen.getByText('Antonio Carlos Ferreira')).toBeInTheDocument()
    expect(screen.getByText('123.456.789-00')).toBeInTheDocument()

    // RevisaoResumo (SCRUM-38) já foi implementado.
    expect(screen.getByText('Revisão da pré-guia')).toBeInTheDocument()

    // SelecaoProcedimentos avisa quando não há OCS escolhida.
    expect(
      screen.getByText(/Por favor, selecione uma OCS na etapa anterior/i),
    ).toBeInTheDocument()

    expect(screen.getByText('Encaminhamento médico')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Enviar pre-guia/i })).toBeInTheDocument()

    // SelecaoOcs terminou de carregar a lista vazia.
    await screen.findByText(/Nenhuma OCS encontrada/i)
  })

  it('SCRUM 23: o arquivo escolhido no upload passa pelo container e volta como preview', async () => {
    render(<NovaPreGuiaPage />)
    await screen.findByText(/Nenhuma OCS encontrada/i)

    const foto = new File(['x'], 'encaminhamento.png', { type: 'image/png' })
    fireEvent.change(screen.getByLabelText('Selecionar arquivo do encaminhamento'), {
      target: { files: [foto] },
    })

    expect(screen.getAllByText('encaminhamento.png').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /Remover e enviar outro arquivo/ }))
    expect(screen.getByRole('button', { name: /Escolher Arquivo/ })).toBeInTheDocument()
  })
})
