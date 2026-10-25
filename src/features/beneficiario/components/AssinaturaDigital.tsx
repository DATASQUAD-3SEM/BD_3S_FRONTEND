import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { ApiError } from '../../../shared/api/http'

/**
 * Cartao de assinatura digital, reutilizado nas telas Minhas informacoes dos tres perfis.
 * Permite desenhar no quadro (mouse ou toque) ou enviar uma imagem PNG/JPG; o botao de salvar
 * so habilita quando ha algo desenhado ou enviado, e um quadro em branco nunca e enviado.
 */

const TIPOS_IMAGEM_ACEITOS = ['image/png', 'image/jpeg']

interface AssinaturaDigitalProps {
  /** true = beneficiario ja tem assinatura salva (badge verde). */
  cadastrada: boolean
  /**
   * Recebe a assinatura como imagem PNG e salva.
   * Quem chama decide como salvar (mock ou backend). Se falhar, lance um erro.
   */
  onSalvar: (imagem: Blob) => Promise<void>
}

interface Mensagem {
  tipo: 'sucesso' | 'erro'
  texto: string
}

/**
 * true se o quadro estiver sem nenhum traço.
 * Olha os pixels de verdade: um simples clique (sem arrastar) não conta como assinatura.
 */
function quadroEstaVazio(canvas: HTMLCanvasElement): boolean {
  const ctx = canvas.getContext('2d')
  if (!ctx || canvas.width === 0 || canvas.height === 0) return true

  const pixels = ctx.getImageData(0, 0, canvas.width, canvas.height).data

  // Cada pixel ocupa 4 posições: vermelho, verde, azul e transparência.
  // Se alguma transparência for diferente de 0, existe algo desenhado.
  for (let i = 3; i < pixels.length; i += 4) {
    if (pixels[i] !== 0) return false
  }

  return true
}

function canvasParaPng(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob)
      else reject(new Error('Não foi possível gerar a imagem da assinatura.'))
    }, 'image/png')
  })
}

export default function AssinaturaDigital({ cadastrada, onSalvar }: AssinaturaDigitalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const inputImagemRef = useRef<HTMLInputElement | null>(null)
  const [desenhando, setDesenhando] = useState(false)
  const [temConteudo, setTemConteudo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<Mensagem | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const dpr = window.devicePixelRatio || 1

    // Resolução interna = tamanho na tela × DPR (deixa o traço nítido em telas de alta densidade)
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)

    // Mapeia coordenadas da tela para a resolução interna
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0)

    ctx.strokeStyle = '#22382b'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  /** Apaga todo o quadro, ignorando a transformação atual. */
  function apagarQuadro(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
    ctx.beginPath()
  }

  const obterCoordenadas = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    }
  }

  const iniciarDesenho = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    e.currentTarget.setPointerCapture(e.pointerId)
    setDesenhando(true)
    setMensagem(null)

    const { x, y } = obterCoordenadas(e)
    ctx.beginPath()
    ctx.moveTo(x, y)
  }

  const desenhar = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!desenhando) return
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    const { x, y } = obterCoordenadas(e)
    ctx.lineTo(x, y)
    ctx.stroke()
  }

  /** Chamado quando o traço termina: confere se ainda sobrou algum desenho. */
  const finalizarTraco = () => {
    setDesenhando(false)
    const canvas = canvasRef.current
    if (canvas) setTemConteudo(!quadroEstaVazio(canvas))
  }

  const limparQuadro = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    apagarQuadro(canvas, ctx)
    setTemConteudo(false)
    setMensagem(null)
  }

  /** Desenha a imagem enviada dentro do quadro, sem esticar e sem deixar maior do que o quadro. */
  const desenharImagem = (imagem: HTMLImageElement) => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    const rect = canvas.getBoundingClientRect()
    apagarQuadro(canvas, ctx)

    const margem = 12
    const escala = Math.min(
      (rect.width - margem * 2) / imagem.width,
      (rect.height - margem * 2) / imagem.height,
      1,
    )
    const largura = imagem.width * escala
    const altura = imagem.height * escala

    ctx.drawImage(
      imagem,
      (rect.width - largura) / 2,
      (rect.height - altura) / 2,
      largura,
      altura,
    )
  }

  const aoEscolherImagem = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0]
    // Zera o campo para permitir escolher o mesmo arquivo outra vez.
    evento.target.value = ''
    if (!arquivo) return

    setMensagem(null)

    if (!TIPOS_IMAGEM_ACEITOS.includes(arquivo.type)) {
      setMensagem({ tipo: 'erro', texto: 'Envie apenas imagens PNG ou JPG.' })
      return
    }

    const endereco = URL.createObjectURL(arquivo)
    const imagem = new Image()

    imagem.onload = () => {
      desenharImagem(imagem)
      URL.revokeObjectURL(endereco)
      setTemConteudo(true)
    }

    imagem.onerror = () => {
      URL.revokeObjectURL(endereco)
      setMensagem({ tipo: 'erro', texto: 'Não foi possível abrir essa imagem.' })
    }

    imagem.src = endereco
  }

  const salvar = async () => {
    const canvas = canvasRef.current

    // Proteção extra: nunca salva quadro em branco, mesmo que o botão esteja habilitado.
    if (!canvas || quadroEstaVazio(canvas)) {
      setTemConteudo(false)
      setMensagem({ tipo: 'erro', texto: 'Desenhe ou envie uma assinatura antes de salvar.' })
      return
    }

    setSalvando(true)
    setMensagem(null)

    try {
      const imagem = await canvasParaPng(canvas)
      await onSalvar(imagem)
      setMensagem({ tipo: 'sucesso', texto: 'Assinatura salva com sucesso.' })
    } catch (erro: unknown) {
      setMensagem({
        tipo: 'erro',
        texto:
          erro instanceof ApiError
            ? erro.message
            : 'Não foi possível salvar a assinatura. Tente novamente.',
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="info-card">
      <div className="info-assinatura-cabecalho">
        <h2>Assinatura digital</h2>

        {cadastrada ? (
          <span className="info-status-cadastrada">Cadastrada</span>
        ) : (
          <span className="info-status-pendente">Ainda não cadastrada</span>
        )}
      </div>

      <p className="info-assinatura-descricao">
        Usada para assinar documentos. Desenhe no quadro (mouse ou dedo) ou envie uma imagem.
      </p>

      <div
        className="info-quadro-assinatura"
        aria-label="Área de desenho da assinatura digital"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={iniciarDesenho}
          onPointerMove={desenhar}
          onPointerUp={finalizarTraco}
          onPointerCancel={finalizarTraco}
          onLostPointerCapture={finalizarTraco}
        />
      </div>

      <input
        ref={inputImagemRef}
        type="file"
        accept="image/png,image/jpeg"
        hidden
        aria-label="Selecionar imagem da assinatura"
        onChange={aoEscolherImagem}
      />

      <div className="info-assinatura-acoes">
        <button
          type="button"
          className="info-botao-secundario"
          onClick={limparQuadro}
        >
          Limpar
        </button>

        <button
          type="button"
          className="info-botao-secundario"
          onClick={() => inputImagemRef.current?.click()}
        >
          Enviar imagem
        </button>

        <button
          type="button"
          disabled={!temConteudo || salvando}
          onClick={() => void salvar()}
        >
          {salvando ? 'Salvando...' : 'Salvar assinatura'}
        </button>
      </div>

      {mensagem?.tipo === 'sucesso' && (
        <p className="info-mensagem-sucesso" role="status">
          {mensagem.texto}
        </p>
      )}

      {mensagem?.tipo === 'erro' && (
        <p className="info-campo-erro" role="alert">
          {mensagem.texto}
        </p>
      )}
    </section>
  )
}
