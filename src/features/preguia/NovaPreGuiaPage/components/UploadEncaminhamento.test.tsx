import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import UploadEncaminhamento from './UploadEncaminhamento'

// O "jsdom" (o navegador de mentira dos testes) nao tem createObjectURL. Simulamos.
beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:falso')
  URL.revokeObjectURL = vi.fn()
})
afterEach(() => vi.restoreAllMocks())

const pdf = () => new File(['conteudo'], 'encaminhamento.pdf', { type: 'application/pdf' })
const foto = () => new File(['x'], 'foto.png', { type: 'image/png' })

describe('UploadEncaminhamento', () => {
  it('sem arquivo: mostra os botoes de camera e de escolher arquivo', () => {
    render(<UploadEncaminhamento value={null} onChange={vi.fn()} />)

    expect(screen.getByRole('button', { name: /Usar Câmera/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Escolher Arquivo/ })).toBeInTheDocument()
  })

  it('escolher um arquivo avisa a tela pai (onChange)', () => {
    const onChange = vi.fn()
    render(<UploadEncaminhamento value={null} onChange={onChange} />)
    const arquivo = pdf()

    fireEvent.change(screen.getByLabelText('Selecionar arquivo do encaminhamento'), { target: { files: [arquivo] } })

    expect(onChange).toHaveBeenCalledWith(arquivo)
  })

  it('arrastar e soltar um PDF ou imagem funciona', () => {
    const onChange = vi.fn()
    render(<UploadEncaminhamento value={null} onChange={onChange} />)
    const area = screen.getByText(/Arrastre e solte/).parentElement as HTMLElement
    const arquivo = foto()

    fireEvent.drop(area, { dataTransfer: { files: [arquivo] } })

    expect(onChange).toHaveBeenCalledWith(arquivo)
  })

  it('arrastar e soltar um arquivo de outro tipo (.txt) e ignorado', () => {
    const onChange = vi.fn()
    render(<UploadEncaminhamento value={null} onChange={onChange} />)
    const area = screen.getByText(/Arrastre e solte/).parentElement as HTMLElement
    const texto = new File(['oi'], 'nota.txt', { type: 'text/plain' })

    fireEvent.drop(area, { dataTransfer: { files: [texto] } })

    expect(onChange).not.toHaveBeenCalled()
  })

  it('com imagem: mostra preview e nome do arquivo', () => {
    render(<UploadEncaminhamento value={foto()} onChange={vi.fn()} />)

    expect(screen.getByAltText('Encaminhamento')).toBeInTheDocument()
    expect(screen.getByText('foto.png')).toBeInTheDocument()
  })

  it('com PDF: mostra o nome do arquivo (o desenho da 1a pagina depende do PDF.js do navegador)', () => {
    render(<UploadEncaminhamento value={pdf()} onChange={vi.fn()} />)

    expect(screen.getByText('encaminhamento.pdf')).toBeInTheDocument()
  })

  it('"Remover e enviar outro arquivo" avisa a tela pai com null', () => {
    const onChange = vi.fn()
    render(<UploadEncaminhamento value={foto()} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: /Remover e enviar outro arquivo/ }))

    expect(onChange).toHaveBeenCalledWith(null)
  })

  it('clicar no preview abre a visualizacao ampliada e Fechar volta', () => {
    render(<UploadEncaminhamento value={foto()} onChange={vi.fn()} />)

    fireEvent.click(screen.getByTitle('Clique para abrir e visualizar'))
    expect(screen.getByAltText('Visualização completa')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Fechar/ }))
    expect(screen.queryByAltText('Visualização completa')).not.toBeInTheDocument()
  })

  it('camera no desktop sem https/localhost: avisa em vez de quebrar', () => {
    const alerta = vi.spyOn(window, 'alert').mockImplementation(() => {})
    render(<UploadEncaminhamento value={null} onChange={vi.fn()} />)

    fireEvent.click(screen.getByRole('button', { name: /Usar Câmera/ }))

    expect(alerta).toHaveBeenCalledWith(expect.stringContaining('https://'))
  })
})
