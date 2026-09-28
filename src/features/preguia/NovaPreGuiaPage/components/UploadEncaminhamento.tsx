import { useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent } from 'react';

/**
 * SCRUM 23 - Componente de upload do encaminhamento medico (foto ou PDF) com preview.
 *
 * Este componente e "controlado" pela tela pai (NovaPreGuiaPage):
 *   - value    = o arquivo que a tela pai guarda hoje (ou null)
 *   - onChange = como avisar a tela pai que o arquivo mudou
 * Ele nao guarda o arquivo por conta propria: a fonte da verdade e a tela pai.
 */

const PDFJS_SCRIPT = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js';
const PDFJS_WORKER = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

interface PdfViewport {
  width: number;
  height: number;
}
interface PdfPage {
  getViewport(opcoes: { scale: number }): PdfViewport;
  render(opcoes: { canvasContext: CanvasRenderingContext2D; viewport: PdfViewport }): { promise: Promise<void> };
}
interface PdfDocument {
  numPages: number;
  getPage(numero: number): Promise<PdfPage>;
}
interface PdfJsLib {
  GlobalWorkerOptions: { workerSrc: string };
  getDocument(url: string): { promise: Promise<PdfDocument> };
}

// Declaracao para estender a interface Window do TypeScript
declare global {
  interface Window {
    pdfjsLib?: PdfJsLib;
  }
}

interface UploadEncaminhamentoProps {
  value: File | null;
  onChange: (arquivo: File | null) => void;
}

// Detecta se o dispositivo atual e Mobile (fica fora do componente: nao depende de estado)
function detectarMobile(): boolean {
  const mobileRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i;
  const ehTouchOuPequeno = ('ontouchstart' in window || navigator.maxTouchPoints > 0) && window.innerWidth <= 768;
  return mobileRegex.test(navigator.userAgent) || ehTouchOuPequeno;
}

// Desliga a camera (para o "LED" apagar). Recebe a ref inteira para poder zera-la.
function pararCamera(streamRef: { current: MediaStream | null }) {
  streamRef.current?.getTracks().forEach((track) => track.stop());
  streamRef.current = null;
}

export default function UploadEncaminhamento({ value, onChange }: UploadEncaminhamentoProps) {
  const [usandoCamera, setUsandoCamera] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isMobile, setIsMobile] = useState(detectarMobile);
  const [pdfPronto, setPdfPronto] = useState(() => Boolean(window.pdfjsLib));

  // Estados para o Modal de Visualização (Zoom apenas para Imagens)
  const [modalAberto, setModalAberto] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  const inputArquivoRef = useRef<HTMLInputElement>(null);
  const inputFotoNativaRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasCameraRef = useRef<HTMLCanvasElement>(null);
  const pdfCanvasPreviewRef = useRef<HTMLCanvasElement>(null);
  const pdfModalContainerRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // O endereco temporario (blob:) do arquivo para mostrar no preview.
  // Deriva do "value": se a tela pai trocar/limpar o arquivo, o preview acompanha sozinho.
  const preview = useMemo(() => (value ? URL.createObjectURL(value) : null), [value]);
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview); // libera memoria quando o preview muda ou sai da tela
    };
  }, [preview]);

  const isImagem = value?.type.startsWith('image/') ?? false;
  const isPdf = value?.type === 'application/pdf';

  // Reavalia se e mobile quando a janela muda de tamanho
  useEffect(() => {
    const aoRedimensionar = () => setIsMobile(detectarMobile());
    window.addEventListener('resize', aoRedimensionar);
    return () => window.removeEventListener('resize', aoRedimensionar);
  }, []);

  // Desliga a camera se o usuario sair da tela com ela ligada
  useEffect(() => {
    return () => pararCamera(streamRef);
  }, []);

  // Carrega o PDF.js via CDN dinamicamente (uma unica vez para a pagina toda)
  useEffect(() => {
    if (window.pdfjsLib) {
      window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
      return;
    }
    let script = document.querySelector<HTMLScriptElement>('script[data-pdfjs]');
    if (!script) {
      script = document.createElement('script');
      script.src = PDFJS_SCRIPT;
      script.async = true;
      script.dataset.pdfjs = 'true';
      document.head.appendChild(script);
    }
    const aoCarregar = () => {
      if (window.pdfjsLib) {
        window.pdfjsLib.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
        setPdfPronto(true); // avisa o React que ja da para desenhar PDFs
      }
    };
    script.addEventListener('load', aoCarregar);
    const scriptAtual = script;
    return () => scriptAtual.removeEventListener('load', aoCarregar);
  }, []);

  // Renderiza a primeira página do PDF no Preview (card principal)
  useEffect(() => {
    if (!isPdf || !preview || !pdfPronto) return;
    const url = preview;
    let cancelado = false;

    const renderPreview = async () => {
      try {
        const pdfLib = window.pdfjsLib;
        const canvas = pdfCanvasPreviewRef.current;
        if (!pdfLib || !canvas) return;

        const pdf = await pdfLib.getDocument(url).promise;
        const page = await pdf.getPage(1);
        if (cancelado) return;

        const viewport = page.getViewport({ scale: 1.2 });
        const context = canvas.getContext('2d');
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        if (context) {
          await page.render({ canvasContext: context, viewport }).promise;
        }
      } catch (err) {
        console.error('Erro ao renderizar preview do PDF:', err);
      }
    };
    void renderPreview();

    return () => {
      cancelado = true;
    };
  }, [isPdf, preview, pdfPronto]);

  // Renderiza TODAS as páginas do PDF dentro do Modal quando for aberto
  useEffect(() => {
    if (!modalAberto || !isPdf || !preview || !pdfPronto) return;
    const url = preview;
    let cancelado = false;

    const renderPdfCompleto = async () => {
      try {
        const pdfLib = window.pdfjsLib;
        const container = pdfModalContainerRef.current;
        if (!pdfLib || !container) return;

        container.innerHTML = '';

        const pdf = await pdfLib.getDocument(url).promise;

        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
          const page = await pdf.getPage(pageNum);
          if (cancelado) return;
          const viewport = page.getViewport({ scale: 1.5 });

          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');
          canvas.height = viewport.height;
          canvas.width = viewport.width;
          canvas.style.maxWidth = '100%';
          canvas.style.height = 'auto';
          canvas.style.borderRadius = '8px';
          canvas.style.marginBottom = '16px';
          canvas.style.boxShadow = '0 2px 8px rgba(0,0,0,0.3)';

          if (context) {
            await page.render({ canvasContext: context, viewport }).promise;
          }

          container.appendChild(canvas);
        }
      } catch (err) {
        console.error('Erro ao renderizar páginas do PDF no modal:', err);
      }
    };

    const timer = setTimeout(() => void renderPdfCompleto(), 50);
    return () => {
      cancelado = true;
      clearTimeout(timer);
    };
  }, [modalAberto, isPdf, preview, pdfPronto]);

  // Handlers de Drag and Drop
  function handleDragOver(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }

  function handleDragLeave(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }

  function handleDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile && (droppedFile.type.startsWith('image/') || droppedFile.type === 'application/pdf')) {
      processarArquivo(droppedFile);
    }
  }

  // Avisa a tela pai que existe um arquivo novo (o preview e recalculado sozinho a partir do "value")
  function processarArquivo(file: File) {
    onChange(file);
  }

  function aoSelecionarArquivo(event: ChangeEvent<HTMLInputElement>) {
    const arquivoSelecionado = event.target.files?.[0];
    if (arquivoSelecionado) {
      processarArquivo(arquivoSelecionado);
    }
  }

  // Handler unificado de acionamento da câmera
  function handleCliqueCamera() {
    if (isMobile) {
      // No mobile, dispara a câmera nativa do SO diretamente
      inputFotoNativaRef.current?.click();
    } else {
      // No desktop, abre a webcam web em tempo real
      void abrirCamera();
    }
  }

  async function abrirCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      alert('Câmera indisponível neste endereço. Ela só funciona em https:// ou em localhost. Use "Escolher Arquivo".');
      return;
    }
    setUsandoCamera(true);
    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: 'environment',
          width: { ideal: 1920 },
          height: { ideal: 1080 }
        },
        audio: false
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      const detalhe = err instanceof DOMException ? `${err.name} - ${err.message}` : String(err);
      alert(`Erro na câmera: ${detalhe}`);
      fecharCamera();
    }
  }

  function fecharCamera() {
    pararCamera(streamRef);
    setUsandoCamera(false);
  }

  function tirarFoto() {
    if (videoRef.current && canvasCameraRef.current) {
      const video = videoRef.current;
      const canvas = canvasCameraRef.current;
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          if (blob) {
            const fotoArquivo = new File([blob], `foto_${Date.now()}.jpg`, { type: 'image/jpeg' });
            processarArquivo(fotoArquivo);
            fecharCamera();
          }
        }, 'image/jpeg');
      }
    }
  }

  function limpar() {
    setModalAberto(false);
    if (inputArquivoRef.current) inputArquivoRef.current.value = '';
    if (inputFotoNativaRef.current) inputFotoNativaRef.current.value = '';
    onChange(null);
  }

  return (
    <div style={{
      backgroundColor: '#ffffff',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 1px 4px rgba(0,0,0,0.05)',
      marginBottom: '20px',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <h3 style={{
        marginTop: 0,
        marginBottom: '20px',
        color: '#1a2e22',
        fontSize: '20px',
        fontFamily: 'serif',
        fontWeight: 'bold'
      }}>
        Encaminhamento médico
      </h3>

      {/* Input para arquivos em geral (PDFs e imagens) */}
      <input
        type="file"
        ref={inputArquivoRef}
        aria-label="Selecionar arquivo do encaminhamento"
        style={{ display: 'none' }}
        accept="image/*,application/pdf"
        onChange={aoSelecionarArquivo}
      />

      {/* Input específico para acionar a Câmera Nativa no Mobile */}
      <input
        type="file"
        ref={inputFotoNativaRef}
        aria-label="Tirar foto do encaminhamento"
        style={{ display: 'none' }}
        accept="image/*"
        capture="environment"
        onChange={aoSelecionarArquivo}
      />

      <canvas ref={canvasCameraRef} style={{ display: 'none' }} />

      {usandoCamera ? (
        <div style={{ textAlign: 'center' }}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            style={{ width: '100%', borderRadius: '12px', backgroundColor: '#000' }}
          />
          <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
            <button
              type="button"
              onClick={tirarFoto}
              style={{
                flex: 1,
                padding: '12px',
                backgroundColor: '#1a4331',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              📸 Capturar Foto
            </button>
            <button
              type="button"
              onClick={fecharCamera}
              style={{
                padding: '12px 20px',
                backgroundColor: '#991b1b',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer'
              }}
            >
              Cancelar
            </button>
          </div>
        </div>
      ) : !preview ? (
        /* Caixas de Seleção / Drag and Drop */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{
            border: isDragging ? '2px dashed #1a4331' : '2px dashed #e2e8f0',
            backgroundColor: isDragging ? '#f0fdf4' : '#fafafa',
            padding: '40px 20px',
            borderRadius: '12px',
            textAlign: 'center',
            transition: 'all 0.2s ease',
            cursor: 'pointer'
          }}
        >
          <p style={{ margin: '0 0 16px 0', color: '#64748b', fontSize: '14px' }}>
            Arrastre e solte sua imagem ou PDF aqui, ou use os botões abaixo:
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
            {/* Botão Único da Câmera (Desktop = Web, Mobile = Nativo) */}
            <button
              type="button"
              onClick={handleCliqueCamera}
              style={{
                padding: '10px 14px',
                backgroundColor: '#1a4331',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px'
              }}
            >
              📷 Usar Câmera
            </button>

            <button
              type="button"
              onClick={() => inputArquivoRef.current?.click()}
              style={{
                padding: '10px 14px',
                backgroundColor: '#f1f5f9',
                color: '#334155',
                border: '1px solid #cbd5e1',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                fontSize: '13px'
              }}
            >
              📁 Escolher Arquivo
            </button>
          </div>
        </div>
      ) : (
        /* Pré-visualização com Limite Fixo */
        <div>
          <div
            onClick={() => { setModalAberto(true); setZoomLevel(1); }}
            title="Clique para abrir e visualizar"
            style={{
              border: '1px dashed #d1d5db',
              borderRadius: '12px',
              padding: '16px',
              maxHeight: '260px',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: '#fff',
              cursor: 'pointer',
              position: 'relative'
            }}
          >
            {isImagem && (
              <img
                src={preview}
                alt="Encaminhamento"
                style={{
                  maxWidth: '100%',
                  maxHeight: '220px',
                  objectFit: 'contain',
                  borderRadius: '4px'
                }}
              />
            )}

            {isPdf && (
              <canvas
                ref={pdfCanvasPreviewRef}
                style={{
                  maxWidth: '100%',
                  maxHeight: '220px',
                  objectFit: 'contain',
                  borderRadius: '4px'
                }}
              />
            )}
          </div>

          {/* Nome do arquivo: tambem serve de plano B se o preview do PDF nao carregar */}
          <p style={{ margin: '12px 0 0 0', color: '#64748b', fontSize: '13px', wordBreak: 'break-all' }}>
            {value?.name}
          </p>

          <button
            type="button"
            onClick={limpar}
            style={{
              marginTop: '16px',
              color: '#c25e00',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              padding: 0
            }}
          >
            Remover e enviar outro arquivo
          </button>
        </div>
      )}

      {/* Modal de Exibição / Lightbox */}
      {modalAberto && preview && (
        <div
          onClick={() => setModalAberto(false)}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              marginBottom: '15px',
              display: 'flex',
              gap: '8px',
              backgroundColor: '#fff',
              padding: '8px 12px',
              borderRadius: '24px',
              alignItems: 'center',
              flexWrap: 'wrap',
              justifyContent: 'center'
            }}
          >
            {isImagem && (
              <>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(z + 0.3, 3))}
                  aria-label="Aumentar zoom"
                  style={{
                    cursor: 'pointer',
                    border: '1px solid #cbd5e1',
                    background: '#f1f5f9',
                    color: '#334155',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    minWidth: '90px',
                  }}
                >
                  Aumentar
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(z - 0.3, 0.5))}
                  aria-label="Reduzir zoom"
                  style={{
                    cursor: 'pointer',
                    border: '1px solid #cbd5e1',
                    background: '#f1f5f9',
                    color: '#334155',
                    borderRadius: '6px',
                    padding: '6px 12px',
                    fontSize: '14px',
                    fontWeight: 600,
                    minWidth: '90px',
                  }}
                >
                  Reduzir
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setModalAberto(false)}
              aria-label="Fechar visualização"
              style={{
                cursor: 'pointer',
                border: 'none',
                background: '#991b1b',
                color: '#fff',
                borderRadius: '6px',
                padding: '6px 14px',
                fontSize: '14px',
                fontWeight: 600,
              }}
            >
              ✕ Fechar
            </button>
          </div>

          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: '85vh',
              maxWidth: '90vw',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            {isImagem && (
              <img
                src={preview}
                alt="Visualização completa"
                style={{
                  transform: `scale(${zoomLevel})`,
                  transition: 'transform 0.2s ease',
                  maxWidth: '100%',
                  borderRadius: '8px'
                }}
              />
            )}

            {isPdf && (
              <div
                ref={pdfModalContainerRef}
                style={{
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center'
                }}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
