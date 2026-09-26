import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import NovaPreGuiaPage from '.'

describe('NovaPreGuiaPage', () => {
  it('renderiza o container com todos os componentes', () => {
    render(<NovaPreGuiaPage />)

    // Componentes que ainda utilizam EmConstrucao
    for (const nome of [
      'DadosBeneficiario',
      'SelecaoOcs',
      'UploadEncaminhamento',
      'RevisaoResumo',
    ]) {
      expect(screen.getByText(nome)).toBeInTheDocument()
    }

    // Valida o alerta inicial do SelecaoProcedimentos quando nenhuma OCS está selecionada
    expect(
      screen.getByText(/Por favor, selecione uma OCS na etapa anterior/i)
    ).toBeInTheDocument()

    // Valida o botão de envio
    expect(
      screen.getByRole('button', { name: /Enviar pre-guia/i })
    ).toBeInTheDocument()
  })
})
