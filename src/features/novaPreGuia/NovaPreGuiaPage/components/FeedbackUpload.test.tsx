import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import FeedbackUpload from './FeedbackUpload'

function arquivo(nome: string, tamanhoBytes: number, tipo = ''): File {
  return new File([new Uint8Array(tamanhoBytes)], nome, { type: tipo })
}

describe('FeedbackUpload (SCRUM 24)', () => {
  it('não renderiza nada quando não há arquivo', () => {
    const { container } = render(<FeedbackUpload arquivo={null} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('PDF dentro do limite mostra OK', () => {
    render(<FeedbackUpload arquivo={arquivo('encaminhamento.pdf', 1024, 'application/pdf')} />)
    expect(screen.getByRole('status')).toHaveTextContent(/pronto para envio/i)
  })

  it('JPG e PNG também são aceitos', () => {
    const { unmount } = render(
      <FeedbackUpload arquivo={arquivo('foto.jpg', 1024, 'image/jpeg')} />,
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
    unmount()

    render(<FeedbackUpload arquivo={arquivo('foto.png', 1024, 'image/png')} />)
    expect(screen.getByRole('status')).toBeInTheDocument()
  })

  it('arquivo > 10 MB mostra erro', () => {
    render(
      <FeedbackUpload arquivo={arquivo('grande.pdf', 11 * 1024 * 1024, 'application/pdf')} />,
    )
    expect(screen.getByRole('alert')).toHaveTextContent(/10 MB/i)
  })

  it('tipo inválido (.txt) mostra erro', () => {
    render(<FeedbackUpload arquivo={arquivo('nota.txt', 100, 'text/plain')} />)
    expect(screen.getByRole('alert')).toHaveTextContent(/Formato inválido/i)
  })

  it('exatamente 10 MB é aceito (limite inclusivo)', () => {
    render(
      <FeedbackUpload arquivo={arquivo('limite.pdf', 10 * 1024 * 1024, 'application/pdf')} />,
    )
    expect(screen.getByRole('status')).toBeInTheDocument()
  })
})
