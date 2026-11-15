import { useEffect, useRef, useState } from 'react'
import { guiasFinalizadasApi } from './api'

interface Props {
  guiaId: number
  numero: string
  onFechar: () => void
}

const ZOOM_MINIMO = 0.5
const ZOOM_MAXIMO = 2
const PASSO_ZOOM = 0.25

export default function VisualizadorPdf({ guiaId, numero, onFechar }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando')
  const [zoom, setZoom] = useState(1)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let ativo = true
    let url: string | null = null
    guiasFinalizadasApi
      .obterPdf(guiaId)
      .then((pdf) => {
        if (!ativo) return
        url = URL.createObjectURL(pdf)
        setPdfUrl(url)
        setEstado('pronto')
      })
      .catch(() => {
        if (ativo) setEstado('erro')
      })
    return () => {
      ativo = false
      if (url) URL.revokeObjectURL(url)
    }
  }, [guiaId])

  function alternarTelaCheia() {
    const elemento = containerRef.current
    if (!elemento || typeof elemento.requestFullscreen !== 'function') return
    if (document.fullscreenElement) {
      void document.exitFullscreen()
    } else {
      void elemento.requestFullscreen()
    }
  }

  return (
    <div ref={containerRef} className="ge-visualizador" aria-label={`PDF da guia ${numero}`}>
      <div className="ge-visualizador-barra">
        <span className="ge-visualizador-aviso">Visualização somente leitura</span>
        <div className="ge-visualizador-controles">
          <button
            type="button"
            className="botao"
            aria-label="Diminuir zoom"
            disabled={zoom <= ZOOM_MINIMO}
            onClick={() => setZoom((z) => Math.max(ZOOM_MINIMO, z - PASSO_ZOOM))}
          >
            −
          </button>
          <span>{`${Math.round(zoom * 100)}%`}</span>
          <button
            type="button"
            className="botao"
            aria-label="Aumentar zoom"
            disabled={zoom >= ZOOM_MAXIMO}
            onClick={() => setZoom((z) => Math.min(ZOOM_MAXIMO, z + PASSO_ZOOM))}
          >
            +
          </button>
          <button type="button" className="botao" onClick={alternarTelaCheia}>
            Tela cheia
          </button>
          <button type="button" className="botao" onClick={onFechar}>
            Fechar guia
          </button>
        </div>
      </div>

      {estado === 'carregando' && <p aria-busy="true">Carregando guia…</p>}
      {estado === 'erro' && (
        <p role="alert" className="estado-erro">
          Não foi possível carregar a guia.
        </p>
      )}
      {estado === 'pronto' && pdfUrl && (
        <div className="ge-visualizador-area">
          <iframe
            src={pdfUrl}
            title={`PDF da guia ${numero}`}
            className="ge-visualizador-pdf"
            style={{ transform: `scale(${zoom})` }}
          />
        </div>
      )}
    </div>
  )
}
