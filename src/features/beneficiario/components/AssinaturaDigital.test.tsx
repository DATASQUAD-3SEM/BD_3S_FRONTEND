import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AssinaturaDigital from './AssinaturaDigital'
import { ApiError } from '../../../shared/api/http'

/**
 * Testes do cartao de assinatura digital: badge de situacao, quadro de desenho e envio de imagem.
 */

describe('AssinaturaDigital', () => {
  it('mostra o badge amarelo quando ainda não há assinatura', () => {
    render(<AssinaturaDigital cadastrada={false} onSalvar={vi.fn()} />)

    expect(screen.getByText('Ainda não cadastrada')).toHaveClass('info-status-pendente')
  })

  it('mostra o badge verde quando a assinatura já está cadastrada', async () => {
    render(
      <AssinaturaDigital cadastrada onSalvar={vi.fn()} buscarAtual={vi.fn().mockResolvedValue(null)} />,
    )

    expect(screen.getByText('Cadastrada')).toHaveClass('info-status-cadastrada')
    await screen.findByText('Nenhuma assinatura cadastrada.')
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

/**
 * T37-FE1: pre-visualizacao da assinatura atual (area fixa 3:1) e quadro de desenho 3:1 com linha-guia.
 */
describe('AssinaturaDigital - pré-visualização', () => {
  const imagemPng = (conteudo: string) => new Blob([conteudo], { type: 'image/png' })

  beforeEach(() => {
    let contador = 0
    // O jsdom nao tem createObjectURL/revokeObjectURL.
    URL.createObjectURL = vi.fn(() => `blob:previa-${++contador}`)
    URL.revokeObjectURL = vi.fn()
  })

  afterEach(() => vi.restoreAllMocks())

  it('sem assinatura cadastrada mostra o aviso e nem consulta o servidor', () => {
    const buscarAtual = vi.fn()

    render(<AssinaturaDigital cadastrada={false} onSalvar={vi.fn()} buscarAtual={buscarAtual} />)

    expect(screen.getByLabelText('Pré-visualização da assinatura atual')).toHaveClass(
      'info-previa-assinatura',
    )
    expect(screen.getByText('Nenhuma assinatura cadastrada.')).toBeInTheDocument()
    expect(buscarAtual).not.toHaveBeenCalled()
  })

  it('com assinatura cadastrada mostra a imagem devolvida pelo servidor, inteira e na área fixa', async () => {
    const buscarAtual = vi.fn().mockResolvedValue(imagemPng('atual'))

    render(<AssinaturaDigital cadastrada onSalvar={vi.fn()} buscarAtual={buscarAtual} />)

    const imagem = await screen.findByAltText('Assinatura atual cadastrada')
    expect(imagem).toHaveAttribute('src', 'blob:previa-1')
    expect(screen.getByLabelText('Pré-visualização da assinatura atual')).toContainElement(imagem)
    expect(buscarAtual).toHaveBeenCalledTimes(1)
  })

  it('mostra o aviso de carregamento enquanto a imagem não chega', () => {
    const buscarAtual = vi.fn(() => new Promise<Blob | null>(() => {}))

    render(<AssinaturaDigital cadastrada onSalvar={vi.fn()} buscarAtual={buscarAtual} />)

    expect(screen.getByText('Carregando a assinatura...')).toBeInTheDocument()
  })

  it('quando o servidor não tem a assinatura (null) mostra o aviso de vazio', async () => {
    const buscarAtual = vi.fn().mockResolvedValue(null)

    render(<AssinaturaDigital cadastrada onSalvar={vi.fn()} buscarAtual={buscarAtual} />)

    expect(await screen.findByText('Nenhuma assinatura cadastrada.')).toBeInTheDocument()
    expect(screen.queryByAltText('Assinatura atual cadastrada')).not.toBeInTheDocument()
  })

  it('quando a busca falha avisa que não foi possível carregar', async () => {
    const buscarAtual = vi.fn().mockRejectedValue(new ApiError(500, 'Erro 500'))

    render(<AssinaturaDigital cadastrada onSalvar={vi.fn()} buscarAtual={buscarAtual} />)

    expect(
      await screen.findByText('Não foi possível carregar a assinatura atual.'),
    ).toBeInTheDocument()
  })

  it('o quadro de desenho tem a linha-guia, a dica e resolução fixa 3:1', () => {
    const { container } = render(<AssinaturaDigital cadastrada={false} onSalvar={vi.fn()} />)

    expect(screen.getByText('Assine sobre a linha')).toBeInTheDocument()
    expect(container.querySelector('.info-quadro-linha-guia')).toBeInTheDocument()

    const canvas = container.querySelector('canvas') as HTMLCanvasElement
    expect(canvas.width / canvas.height).toBe(3)
  })

  it('depois de salvar busca de novo e passa a mostrar a imagem normalizada do servidor', async () => {
    // O jsdom nao desenha: um contexto de mentira marca o quadro como "com traco" e gera o PNG.
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({
      getImageData: () => ({ data: new Uint8ClampedArray([0, 0, 0, 255]) }),
      clearRect: vi.fn(),
      beginPath: vi.fn(),
      moveTo: vi.fn(),
      lineTo: vi.fn(),
      stroke: vi.fn(),
    } as unknown as CanvasRenderingContext2D)
    vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation((retorno) =>
      retorno(imagemPng('desenho')),
    )
    HTMLCanvasElement.prototype.setPointerCapture = vi.fn()

    const onSalvar = vi.fn().mockResolvedValue(undefined)
    const buscarAtual = vi
      .fn()
      .mockResolvedValueOnce(imagemPng('antiga'))
      .mockResolvedValueOnce(imagemPng('nova'))

    const { container } = render(
      <AssinaturaDigital cadastrada onSalvar={onSalvar} buscarAtual={buscarAtual} />,
    )
    expect(await screen.findByAltText('Assinatura atual cadastrada')).toHaveAttribute(
      'src',
      'blob:previa-1',
    )

    const canvas = container.querySelector('canvas') as HTMLCanvasElement
    fireEvent.pointerDown(canvas, { pointerId: 1 })
    fireEvent.pointerMove(canvas, { pointerId: 1 })
    fireEvent.pointerUp(canvas, { pointerId: 1 })

    fireEvent.click(screen.getByRole('button', { name: 'Salvar assinatura' }))

    await waitFor(() => expect(onSalvar).toHaveBeenCalledTimes(1))
    await waitFor(() =>
      expect(screen.getByAltText('Assinatura atual cadastrada')).toHaveAttribute(
        'src',
        'blob:previa-2',
      ),
    )
    expect(buscarAtual).toHaveBeenCalledTimes(2)
  })
})
