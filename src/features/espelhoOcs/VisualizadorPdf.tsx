import { useEffect, useRef, useState } from 'react'
import { guiasFinalizadasApi } from './api'
import './guiasFinalizadas.css'

interface Props {
  guiaId: number
  numero: string
  onFechar: () => void
  /** Quem busca o PDF. Sem ele, usa a rota da OCS (guia finalizada). T23-FE1 passa a rota do beneficiario. */
  obterPdf?: () => Promise<Blob>
}

const ZOOM_MINIMO = 0.5
const ZOOM_MAXIMO = 2
const PASSO_ZOOM = 0.25

export default function VisualizadorPdf({ guiaId, numero, onFechar, obterPdf }: Props) {
  const [pdfUrl, setPdfUrl] = useState<string | null>(null)
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando')
  const [zoom, setZoom] = useState(1)
  // T18-FE-4: reexecuta o efeito de busca após falha, sem recarregar a lista.
  const [tentativa, setTentativa] = useState(0)
  const containerRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    let ativo = true
    let url: string | null = null
    const buscar = obterPdf ?? (() => guiasFinalizadasApi.obterPdf(guiaId))
    buscar()
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
  }, [guiaId, obterPdf, tentativa])

  // O setState do retry fica no handler, nao no efeito (react-hooks/set-state-in-effect).
  function tentarNovamente() {
    setEstado('carregando')
    setPdfUrl(null)
    setTentativa((n) => n + 1)
  }

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
        <div>
          <p role="alert" className="estado-erro">
            Não foi possível carregar a guia.
          </p>
          <button type="button" className="botao" onClick={tentarNovamente}>
            Tentar novamente
          </button>
        </div>
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
