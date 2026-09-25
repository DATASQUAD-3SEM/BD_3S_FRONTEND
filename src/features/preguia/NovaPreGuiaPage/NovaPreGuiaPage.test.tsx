import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import NovaPreGuiaPage from '.'

// O jsdom (navegador de mentira dos testes) não tem createObjectURL.
// O UploadEncaminhamento usa para gerar o preview. Precisa simular.
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:falso')
  URL.revokeObjectURL = vi.fn()
})

describe('NovaPreGuiaPage', () => {
  it('renderiza o container com todos os componentes', () => {
    render(<NovaPreGuiaPage />)

    // Ainda são EmConstrucao. Quando alguém implementar o seu,
    // REMOVA o nome dele desta lista
    for (const nome of ['DadosBeneficiario', 'SelecaoOcs', 'FeedbackUpload', 'RevisaoResumo']) {
      expect(screen.getByText(nome)).toBeInTheDocument()
    }

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

    expect(screen.getByText('encaminhamento.png')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Remover e enviar outro arquivo/ }))
    expect(screen.getByRole('button', { name: /Escolher Arquivo/ })).toBeInTheDocument()
  })
})
