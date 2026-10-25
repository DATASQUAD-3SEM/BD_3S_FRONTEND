import { useEffect, useRef, useState } from 'react'
import { imprimirIframe } from './imprimirPdf'
import type { GuiaRecepcao, GuiasRecepcaoApi } from './types'

/**
 * Janela "Guia de encaminhamento" aberta sobre a lista da recepcao, com o PDF e os botoes Imprimir,
 * Baixar PDF e Fechar. A tecla Esc fecha a janela e o foco volta para o botao que a abriu.
 */

interface Props {
  guia: GuiaRecepcao
  api: GuiasRecepcaoApi
  onFechar: () => void
}

export default function VisualizarGuiaModal({ guia, api, onFechar }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  const dialogRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let ativo = true
    let url: string | null = null

    api
      .obterPdf(guia.guiaId, 'visualizar')
      .then((pdf) => {
        if (!ativo) return
        url = URL.createObjectURL(pdf)
        setPdfUrl(url)
      })
      .catch(() => {
        if (ativo) setErro('Não foi possível abrir o PDF da Guia.')
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [api, guia.guiaId])

  useEffect(() => {
    dialogRef.current?.focus()
  }, [])

  useEffect(() => {
    function aoPressionarTecla(evento: KeyboardEvent) {
      if (evento.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', aoPressionarTecla)
    return () => window.removeEventListener('keydown', aoPressionarTecla)
  }, [onFechar])

  async function baixar() {
    setErro(null)
    try {
      const pdf = await api.obterPdf(guia.guiaId, 'baixar')
      const url = URL.createObjectURL(pdf)
      const link = document.createElement('a')
      link.href = url
      link.download = `guia-${guia.numero}.pdf`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 60_000)
    } catch {
      setErro('Não foi possível baixar o PDF da Guia.')
    }
  }

  return (
    <div className="modal-fundo">
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="titulo-modal-guia"
        aria-describedby="descricao-modal-guia"
        className="modal"
        tabIndex={-1}
      >
        <header className="modal__cabecalho">
          <h2 id="titulo-modal-guia">Guia de encaminhamento · {guia.numero}</h2>
          <button type="button" className="botao" onClick={onFechar}>
            Fechar
          </button>
        </header>

        <p id="descricao-modal-guia" className="modal__descricao">
          Pré-visualização do PDF da Guia
        </p>

        {carregando && <p aria-busy="true">Carregando PDF…</p>}

        {pdfUrl && (
          <iframe
            ref={iframeRef}
            src={pdfUrl}
            title={`PDF da Guia ${guia.numero}`}
            className="modal__pdf"
          />
        )}

        {erro && (
          <p role="alert" className="estado-erro">
            {erro}
          </p>
        )}

        <footer className="modal__acoes">
          <button
            type="button"
            className="botao botao-primario"
            disabled={!pdfUrl}
            onClick={() => imprimirIframe(iframeRef.current)}
          >
            Imprimir
          </button>
          <button type="button" className="botao" onClick={() => void baixar()}>
            Baixar PDF
          </button>
        </footer>
      </div>
    </div>
  )
}
