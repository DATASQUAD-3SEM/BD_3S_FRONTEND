import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import NovaPreGuiaPage from '.'

describe('NovaPreGuiaPage', () => {
  it('renderiza o container com todos os componentes', () => {
    render(<NovaPreGuiaPage />)

    for (const nome of [
      'DadosBeneficiario',
      'SelecaoOcs',
      'SelecaoProcedimentos',
      'UploadEncaminhamento',
      'FeedbackUpload',
      'RevisaoResumo',
    ]) {
      expect(screen.getByText(nome)).toBeInTheDocument()
    }
    expect(screen.getByRole('button', { name: /Enviar pre-guia/ })).toBeInTheDocument()
  })
})
