import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import NovaPreGuiaPage from '.'

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:falso')
  URL.revokeObjectURL = vi.fn()
})

describe('NovaPreGuiaPage', () => {
  it('renderiza o container com todos os componentes', () => {
    render(<NovaPreGuiaPage />)

    // Ainda são EmConstrucao. Quando alguém implementar o seu,
    // REMOVA o nome dele desta lista.
    for (const nome of ['DadosBeneficiario', 'SelecaoOcs', 'FeedbackUpload']) {
      expect(screen.getByText(nome)).toBeInTheDocument()
    }

    // RevisaoResumo (SCRUM-38) já foi implementado: aparece o título do painel.
    expect(screen.getByText('Revisão da pré-guia')).toBeInTheDocument()

    expect(
      screen.getByText(/Por favor, selecione uma OCS na etapa anterior/i)
    ).toBeInTheDocument()

    expect(screen.getByText('Encaminhamento médico')).toBeInTheDocument()

    expect(screen.getByRole('button', { name: /Enviar pre-guia/i })).toBeInTheDocument()
  })

  it('SCRUM 23: o arquivo escolhido no upload passa pelo container e volta como preview', () => {
    render(<NovaPreGuiaPage />)
    const foto = new File(['x'], 'encaminhamento.png', { type: 'image/png' })

    fireEvent.change(screen.getByLabelText('Selecionar arquivo do encaminhamento'), {
      target: { files: [foto] },
    })

    // O nome aparece 2x agora: no preview do Upload e no resumo do RevisaoResumo.
    // Por isso usamos getAllByText e conferimos que existe pelo menos 1.
    expect(screen.getAllByText('encaminhamento.png').length).toBeGreaterThan(0)

    fireEvent.click(screen.getByRole('button', { name: /Remover e enviar outro arquivo/ }))
    expect(screen.getByRole('button', { name: /Escolher Arquivo/ })).toBeInTheDocument()
  })
})
