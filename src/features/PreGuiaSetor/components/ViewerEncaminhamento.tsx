import { useEffect, useState, type ReactNode } from 'react';

const ZOOM_MINIMO = 50;
const ZOOM_MAXIMO = 200;
const PASSO_ZOOM = 25;

interface Props {
  /** URL temporária (blob) do arquivo. Null enquanto carrega. */
  url: string | null;
  /** Tipo MIME: image/* ou application/pdf. */
  tipo: string;
  nome: string;
  erro: boolean;
}

/** Visualizador de foto ou PDF com zoom e tela cheia (T4-FE). */
export default function ViewerEncaminhamento({ url, tipo, nome, erro }: Props) {
  const [zoom, setZoom] = useState(100);
  const [telaCheia, setTelaCheia] = useState(false);
  const semArquivo = url === null || erro;

  useEffect(() => {
    if (!telaCheia) return;
    const aoPressionarTecla = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') setTelaCheia(false);
    };
    window.addEventListener('keydown', aoPressionarTecla);
    return () => window.removeEventListener('keydown', aoPressionarTecla);
  }, [telaCheia]);

  let conteudo: ReactNode;
  if (erro) {
    conteudo = <p role="alert" className="pgs-viewer__msg">Não foi possível carregar o encaminhamento.</p>;
  } else if (url === null) {
    conteudo = <p role="status" className="pgs-viewer__msg">Carregando encaminhamento…</p>;
  } else if (tipo.startsWith('image/')) {
    conteudo = (
      <img
        className="pgs-viewer__imagem"
        src={url}
        alt={`Encaminhamento: ${nome}`}
        style={{ width: `${zoom}%` }}
      />
    );
  } else {
    // O leitor de PDF do navegador aceita o zoom em #zoom=percentual
    conteudo = (
      <iframe className="pgs-viewer__pdf" src={`${url}#zoom=${zoom}`} title={`Encaminhamento: ${nome}`} />
    );
  }

  return (
    <div
      className={telaCheia ? 'pgs-viewer pgs-viewer--tela-cheia' : 'pgs-viewer'}
      role={telaCheia ? 'dialog' : undefined}
      aria-modal={telaCheia ? true : undefined}
      aria-label={telaCheia ? 'Encaminhamento em tela cheia' : undefined}
    >
      <div className="pgs-viewer__barra">
        <button
          type="button"
          className="botao"
          aria-label="Diminuir zoom"
          disabled={semArquivo || zoom <= ZOOM_MINIMO}
          onClick={() => setZoom((z) => Math.max(ZOOM_MINIMO, z - PASSO_ZOOM))}
        >
          −
        </button>
        <span className="pgs-viewer__zoom" aria-live="polite">{zoom}%</span>
        <button
          type="button"
          className="botao"
          aria-label="Aumentar zoom"
          disabled={semArquivo || zoom >= ZOOM_MAXIMO}
          onClick={() => setZoom((z) => Math.min(ZOOM_MAXIMO, z + PASSO_ZOOM))}
        >
          +
        </button>
        <button type="button" className="botao" onClick={() => setTelaCheia((v) => !v)}>
          {telaCheia ? 'Fechar tela cheia' : 'Tela cheia'}
        </button>
      </div>
      <div className="pgs-viewer__area">{conteudo}</div>
    </div>
  );
}
