import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import AssinaturaDigital from './AssinaturaDigital'

describe('AssinaturaDigital', () => {
  it('mostra o badge amarelo quando ainda não há assinatura', () => {
    render(<AssinaturaDigital cadastrada={false} onSalvar={vi.fn()} />)

    expect(screen.getByText('Ainda não cadastrada')).toHaveClass('info-status-pendente')
  })

  it('mostra o badge verde quando a assinatura já está cadastrada', () => {
    render(<AssinaturaDigital cadastrada onSalvar={vi.fn()} />)

    expect(screen.getByText('Cadastrada')).toHaveClass('info-status-cadastrada')
  })

  it('não deixa salvar quadro em branco', () => {
    render(<AssinaturaDigital cadastrada={false} onSalvar={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Salvar assinatura' })).toBeDisabled()
  })

  it('recusa arquivo que não é PNG nem JPG', () => {
    const { container } = render(<AssinaturaDigital cadastrada={false} onSalvar={vi.fn()} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement

    const arquivo = new File(['conteudo'], 'documento.pdf', { type: 'application/pdf' })
    fireEvent.change(input, { target: { files: [arquivo] } })

    expect(screen.getByText('Envie apenas imagens PNG ou JPG.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar assinatura' })).toBeDisabled()
  })
})
