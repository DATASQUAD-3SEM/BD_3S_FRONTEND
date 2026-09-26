import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import FeedbackUpload from './FeedbackUpload'

/**
 * Cria um File "de mentira" para o teste.
 * Não precisa ser um PDF/JPG real: o navegador (jsdom) não abre o conteúdo,
 * só olha o `type` e o `size`, que é exatamente o que o componente usa.
 */
function criarArquivo(nome: string, tipo: string, tamanhoEmBytes: number): File {
  const conteudo = new Uint8Array(tamanhoEmBytes)
  return new File([conteudo], nome, { type: tipo })
}

const UM_MB = 1024 * 1024

describe('FeedbackUpload (SCRUM 24)', () => {
  it('mostra aviso quando nenhum arquivo foi anexado (arquivo = null)', () => {
    render(<FeedbackUpload arquivo={null} />)

    expect(screen.getByText(/Nenhum arquivo anexado/i)).toBeInTheDocument()
    // não deve aparecer nem sucesso nem erro
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('mostra "Arquivo pronto para envio" para um PDF válido', () => {
    const pdf = criarArquivo('encaminhamento.pdf', 'application/pdf', 1 * UM_MB)

    render(<FeedbackUpload arquivo={pdf} />)

    expect(screen.getByRole('status')).toHaveTextContent(/Arquivo pronto para envio/i)
    // o nome do arquivo aparece para o usuário conferir
    expect(screen.getByText('encaminhamento.pdf')).toBeInTheDocument()
  })

  it('mostra "Arquivo pronto para envio" para um JPG válido', () => {
    const jpg = criarArquivo('foto.jpg', 'image/jpeg', 2 * UM_MB)

    render(<FeedbackUpload arquivo={jpg} />)

    expect(screen.getByRole('status')).toHaveTextContent(/Arquivo pronto para envio/i)
  })

  it('mostra "Arquivo pronto para envio" para um PNG válido', () => {
    const png = criarArquivo('foto.png', 'image/png', 500 * 1024)

    render(<FeedbackUpload arquivo={png} />)

    expect(screen.getByRole('status')).toHaveTextContent(/Arquivo pronto para envio/i)
  })

  it('aceita arquivo de exatamente 10 MB (limite máximo permitido)', () => {
    const limite = criarArquivo('limite.pdf', 'application/pdf', 10 * UM_MB)

    render(<FeedbackUpload arquivo={limite} />)

    expect(screen.getByRole('status')).toHaveTextContent(/Arquivo pronto para envio/i)
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it('mostra erro de formato inválido para um .txt', () => {
    const txt = criarArquivo('anotacoes.txt', 'text/plain', 1 * UM_MB)

    render(<FeedbackUpload arquivo={txt} />)

    expect(screen.getByRole('alert')).toHaveTextContent(/Formato inválido/i)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('mostra erro de formato inválido para um .doc', () => {
    const doc = criarArquivo('encaminhamento.doc', 'application/msword', 1 * UM_MB)

    render(<FeedbackUpload arquivo={doc} />)

    expect(screen.getByRole('alert')).toHaveTextContent(/Formato inválido/i)
  })

  it('mostra erro de tamanho quando o arquivo passa de 10 MB', () => {
    const gigante = criarArquivo('gigante.pdf', 'application/pdf', 11 * UM_MB)

    render(<FeedbackUpload arquivo={gigante} />)

    expect(screen.getByRole('alert')).toHaveTextContent(/muito grande/i)
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })

  it('prioriza o erro de formato quando o arquivo é inválido E grande', () => {
    // um .txt de 11 MB: queremos a mensagem de formato (o usuário não deve nem tentar enviar)
    const txtGrande = criarArquivo('gigante.txt', 'text/plain', 11 * UM_MB)

    render(<FeedbackUpload arquivo={txtGrande} />)

    expect(screen.getByRole('alert')).toHaveTextContent(/Formato inválido/i)
  })
})
