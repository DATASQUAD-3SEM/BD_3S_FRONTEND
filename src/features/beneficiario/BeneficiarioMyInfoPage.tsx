import {
  useRef,
  useEffect,
  useState,
  type PointerEvent as ReactPointerEvent,
} from 'react'
import { useBeneficiario } from './BeneficiarioContext.tsx'
import {
  calcularIdade,
  faixaEtaria,
  formatarDataNascimentoComIdade,
} from './calculosBeneficiario'





function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)

  if (digitos.length === 0) return ''

  if (digitos.length <= 2) {
    return digitos.length === 2
      ? `(${digitos})`
      : `(${digitos}`
  }

  if (digitos.length <= 7) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`
  }

  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
}





function ContatoTelefone({
                           telefoneInicial,
                         }: {
  telefoneInicial: string | null | undefined
}) {
  const telefoneOriginal = formatarTelefone(telefoneInicial ?? '')

  const [telefone, setTelefone] = useState(
    () => telefoneOriginal,
  )

  function atualizarTelefone(valor: string) {
    setTelefone(formatarTelefone(valor))
  }

  const quantidadeDigitos = telefone.replace(/\D/g, '').length

  const telefoneValido =
    quantidadeDigitos === 11 && telefone.length === 15

  const telefoneAlterado = telefone !== telefoneOriginal

  return (
    <section className="info-card">
      <h2>Contato</h2>

      <div className="info-contato-linha">
        <div className="info-campo">
          <label htmlFor="telefone">Telefone</label>

          <input
            id="telefone"
            type="tel"
            inputMode="numeric"
            maxLength={15}
            value={telefone}
            onChange={(event) => {
              atualizarTelefone(event.currentTarget.value)
            }}
            placeholder="(00) 00000-0000"
            aria-invalid={!telefoneValido}
            aria-describedby={
              !telefoneValido ? 'telefone-erro' : undefined
            }
          />

          {!telefoneValido && (
            <p
              id="telefone-erro"
              className="info-campo-erro"
              role="alert"
            >
              Informe um telefone completo no formato (00) 00000-0000.
            </p>
          )}
        </div>

        <button
          type="button"
          disabled={!telefoneValido || !telefoneAlterado}
        >
          Salvar telefone
        </button>
      </div>
    </section>
  )
}




function AssinaturaDigital() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const [desenhando, setDesenhando] = useState(false)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    if (rect.width === 0 || rect.height === 0) return

    const dpr = window.devicePixelRatio || 1

    // Resolução interna = tamanho CSS × DPR
    canvas.width = Math.round(rect.width * dpr)
    canvas.height = Math.round(rect.height * dpr)

    // Mapeia coordenadas CSS para o bitmap
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    ctx.setTransform(scaleX, 0, 0, scaleY, 0, 0)

    ctx.strokeStyle = '#22382b'
    ctx.lineWidth = 3
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

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

  const pararDesenho = () => {
    setDesenhando(false)
  }

  const limparCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // Limpa o bitmap inteiro, ignorando a transformação atual
    ctx.save()
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.restore()
    ctx.beginPath()
  }

  return (
    <>
      <div
        className="info-quadro-assinatura"
        aria-label="Área de desenho da assinatura digital"
      >
        <canvas
          ref={canvasRef}
          onPointerDown={iniciarDesenho}
          onPointerMove={desenhar}
          onPointerUp={pararDesenho}
          onPointerCancel={pararDesenho}
          onLostPointerCapture={pararDesenho}
        />
      </div>

      <div className="info-assinatura-acoes">
        <button
          type="button"
          className="info-botao-secundario"
          onClick={limparCanvas}
        >
          Limpar
        </button>

        <button type="button" className="info-botao-secundario">
          Enviar imagem
        </button>

        <button type="button">
          Salvar assinatura
        </button>
      </div>
    </>
  )
}





export default function MinhasInformacoesPage() {

  // ---- SOBRE BENEFICIARIO ABAIXO -----

  const {
    beneficiario,
    carregando,
    erro,
  } = useBeneficiario()

  if (carregando) {
    return <p>Carregando beneficiário...</p>
  }

  if (erro || !beneficiario) {
    return (
      <p role="alert">
        Não foi possível carregar os dados do beneficiário.
      </p>
    )
  }

  const idade = calcularIdade(beneficiario.dataNascimento)

  return (
    <div className="minhas-info-page">
      <h1>Minhas informações</h1>

      {/* Dados pessoais */}
      <section className="info-card">
        <h2>Dados pessoais</h2>

        <div className="info-grid">
          <div className="info-dado">
            <span>Nome</span>
            <p>{beneficiario.nome}</p>
          </div>

          <div className="info-dado">
            <span>Grupo</span>
            <p>{beneficiario.grupo ?? '—'}</p>
          </div>

          <div className="info-dado">
            <span>CPF</span>
            <p>{beneficiario.cpf}</p>
          </div>

          <div className="info-dado">
            <span>Prec CP</span>
            <p>{beneficiario.precCp}</p>
          </div>

          <div className="info-dado">
            <span>Data de nascimento</span>
            <p>
              {formatarDataNascimentoComIdade(
                beneficiario.dataNascimento,
              )}
            </p>
          </div>

          <div className="info-dado">
            <span>Faixa etária</span>
            <p>{faixaEtaria(idade) || '—'}</p>
          </div>
        </div>

        <p className="info-observacao">
          Para alterar esses dados, procure o Chefe do FUSEX.
        </p>
      </section>

      {/* Contato */}
      <ContatoTelefone
        key={beneficiario.telefone ?? ''}
        telefoneInicial={beneficiario.telefone}
      />

      {/* Alteração de senha */}
      <section className="info-card">
        <h2>Alterar senha</h2>

        <div className="info-senha-grid">
          <div className="info-campo senha-atual">
            <label htmlFor="senha-atual">Senha atual</label>
            <input
              id="senha-atual"
              type="password"
              autoComplete="current-password"
            />
          </div>

          <div className="info-campo senha-nova">
            <label htmlFor="senha-nova">Nova senha</label>
            <input
              id="senha-nova"
              type="password"
              autoComplete="new-password"
            />
          </div>

          <div className="info-campo senha-confirmacao">
            <label htmlFor="confirmar-senha">
              Confirmar nova senha
            </label>
            <input
              id="confirmar-senha"
              type="password"
              autoComplete="new-password"
            />
          </div>
        </div>

        <button type="button" className="info-botao-senha">
          Alterar senha
        </button>
      </section>

      {/* Assinatura digital */}
      <section className="info-card">
        <div className="info-assinatura-cabecalho">
          <h2>Assinatura digital</h2>

          <span className="info-status-pendente">
            Ainda não cadastrada
          </span>
        </div>

        <p className="info-assinatura-descricao">
          Usada para assinar documentos. Desenhe no quadro
          (mouse ou dedo) ou envie uma imagem.
        </p>

        <AssinaturaDigital />
      </section>
    </div>
  )
}
