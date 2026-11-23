import {
  useEffect,
  useRef,
  useState,
  type ChangeEvent,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { ApiError } from '../../../shared/api/http'
import { buscarAssinaturaAtual } from './assinaturaApi'

/**
 * Cartao de assinatura digital, reutilizado nas cinco telas Minhas informacoes (beneficiario, dependente maior,
 * responsavel legal, medico e chefe).
 * Permite desenhar no quadro (mouse ou toque) ou enviar uma imagem PNG/JPG; o botao de salvar
 * so habilita quando ha algo desenhado ou enviado, e um quadro em branco nunca e enviado.
 *
 * T37-FE1: o quadro de desenho tem proporcao fixa de 3:1 e resolucao interna fixa, entao o traco nao depende do
 * tamanho do quadro na tela (o recorte final e feito pelo servidor, T37-BE1). Acima do quadro fica a
 * pre-visualizacao da assinatura atual, numa area fixa de 3:1, buscada no servidor (T37-BE3) ao abrir a tela e
 * de novo depois de salvar, para mostrar a imagem normalizada que o servidor guardou.
 */

const TIPOS_IMAGEM_ACEITOS = ['image/png', 'image/jpeg']

/** Resolucao interna do quadro (proporcao 3:1, a mesma da imagem que o servidor guarda). */
const LARGURA_QUADRO = 900
const ALTURA_QUADRO = 300
/** Espessura do traco em pixels da tela, qualquer que seja o tamanho do quadro. */
const ESPESSURA_TRACO = 3
/** Margem de cada lado ao encaixar uma imagem enviada, em fracao do quadro. */
const MARGEM_IMAGEM = 0.04

type Previa =
  | { situacao: 'carregando' }
  | { situacao: 'vazia' }
  | { situacao: 'erro' }
  | { situacao: 'pronta'; endereco: string }

const AVISO_PREVIA: Record<'carregando' | 'vazia' | 'erro', string> = {
  carregando: 'Carregando a assinatura...',
  vazia: 'Nenhuma assinatura cadastrada.',
  erro: 'Não foi possível carregar a assinatura atual.',
}

interface AssinaturaDigitalProps {
  /** true = beneficiario ja tem assinatura salva (badge verde). */
  cadastrada: boolean
  /**
   * Recebe a assinatura como imagem PNG e salva.
   * Quem chama decide como salvar (mock ou backend). Se falhar, lance um erro.
   */
  onSalvar: (imagem: Blob) => Promise<void>
  /**
   * Busca a imagem da assinatura atual (null = ainda nao cadastrada). Padrao: GET /usuarios/me/assinatura.
   * Passe sempre a mesma funcao entre renderizacoes (nunca uma funcao criada dentro do render).
   */
  buscarAtual?: () => Promise<Blob | null>
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

export default function AssinaturaDigital({
  cadastrada,
  onSalvar,
  buscarAtual = buscarAssinaturaAtual,
}: AssinaturaDigitalProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const inputImagemRef = useRef<HTMLInputElement | null>(null)
  const [desenhando, setDesenhando] = useState(false)
  const [temConteudo, setTemConteudo] = useState(false)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<Mensagem | null>(null)
  const [previa, setPrevia] = useState<Previa>(
    cadastrada ? { situacao: 'carregando' } : { situacao: 'vazia' },
  )
  // Sobe a cada salvamento para buscar de novo a imagem que o servidor guardou.
  const [versaoPrevia, setVersaoPrevia] = useState(0)

  useEffect(() => {
    if (!cadastrada && versaoPrevia === 0) return

    let cancelado = false

    buscarAtual()
      .then((imagem) => {
        if (cancelado) return
        setPrevia(
          imagem
            ? { situacao: 'pronta', endereco: URL.createObjectURL(imagem) }
            : { situacao: 'vazia' },
        )
      })
      .catch(() => {
        if (!cancelado) setPrevia({ situacao: 'erro' })
      })

    return () => {
      cancelado = true
    }
  }, [cadastrada, versaoPrevia, buscarAtual])

  // Libera o endereco da imagem anterior quando chega outra e ao sair da tela.
  useEffect(() => {
    if (previa.situacao !== 'pronta') return
    const endereco = previa.endereco
    return () => URL.revokeObjectURL(endereco)
  }, [previa])

  /** Apaga todo o quadro. */
  function apagarQuadro(canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.beginPath()
  }

  /** Quantos pixels internos do quadro cabem em um pixel da tela (o quadro se ajusta a largura disponivel). */
  const escalaDoQuadro = (canvas: HTMLCanvasElement, rect: DOMRect) =>
    rect.width > 0 ? canvas.width / rect.width : 1

  /** Posicao do ponteiro em pixels internos do quadro, qualquer que seja o tamanho dele na tela. */
  const obterCoordenadas = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const canvas = e.currentTarget
    const rect = canvas.getBoundingClientRect()
    const escala = escalaDoQuadro(canvas, rect)
    return {
      x: (e.clientX - rect.left) * escala,
      y: (e.clientY - rect.top) * escala,
    }
  }

  const iniciarDesenho = (e: ReactPointerEvent<HTMLCanvasElement>) => {
    const ctx = canvasRef.current?.getContext('2d')
    if (!ctx) return

    e.currentTarget.setPointerCapture(e.pointerId)
    setDesenhando(true)
    setMensagem(null)

    ctx.strokeStyle = '#22382b'
    ctx.lineWidth =
      ESPESSURA_TRACO * escalaDoQuadro(e.currentTarget, e.currentTarget.getBoundingClientRect())
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'

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

    apagarQuadro(canvas, ctx)

    const margemX = canvas.width * MARGEM_IMAGEM
    const margemY = canvas.height * MARGEM_IMAGEM
    const escala = Math.min(
      (canvas.width - margemX * 2) / imagem.width,
      (canvas.height - margemY * 2) / imagem.height,
      1,
    )
    const largura = imagem.width * escala
    const altura = imagem.height * escala

    ctx.drawImage(
      imagem,
      (canvas.width - largura) / 2,
      (canvas.height - altura) / 2,
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
      setVersaoPrevia((versao) => versao + 1)
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

      <p className="info-assinatura-rotulo">Assinatura atual</p>
      <div
        className="info-previa-assinatura"
        aria-label="Pré-visualização da assinatura atual"
      >
        {previa.situacao === 'pronta' ? (
          <img src={previa.endereco} alt="Assinatura atual cadastrada" />
        ) : (
          <span
            className="info-previa-assinatura-aviso"
            role={previa.situacao === 'erro' ? 'alert' : 'status'}
          >
            {AVISO_PREVIA[previa.situacao]}
          </span>
        )}
      </div>

      <p className="info-assinatura-rotulo">Nova assinatura</p>
      <div
        className="info-quadro-assinatura"
        aria-label="Área de desenho da assinatura digital"
      >
        <div className="info-quadro-linha-guia" aria-hidden="true" />
        <span className="info-quadro-dica" aria-hidden="true">
          Assine sobre a linha
        </span>
        <canvas
          ref={canvasRef}
          width={LARGURA_QUADRO}
          height={ALTURA_QUADRO}
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
