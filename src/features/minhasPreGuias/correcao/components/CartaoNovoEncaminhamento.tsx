import { useRef, useState, type ChangeEvent, type DragEvent } from 'react';

const EXTENSOES_PERMITIDAS = ['pdf', 'jpg', 'jpeg', 'png'];
const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024; // 10 MB
const ACEITOS = '.pdf,.jpg,.jpeg,.png,application/pdf,image/jpeg,image/png';

/** Devolve a mensagem de erro do arquivo, ou null se ele pode ser enviado. */
export function validarEncaminhamento(arquivo: File): string | null {
  const ponto = arquivo.name.lastIndexOf('.');
  const extensao = ponto < 0 ? '' : arquivo.name.slice(ponto + 1).toLowerCase();
  if (!EXTENSOES_PERMITIDAS.includes(extensao)) {
    return 'Formato inválido. Envie PDF, JPG ou PNG.';
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return 'Arquivo maior que o limite de 10 MB.';
  }
  return null;
}

interface Props {
  arquivo: File | null;
  onChange: (arquivo: File) => void;
}

/** Cartão "Novo encaminhamento médico" da correção (T9-FE). */
export default function CartaoNovoEncaminhamento({ arquivo, onChange }: Props) {
  const [erro, setErro] = useState<string | null>(null);
  const [arrastando, setArrastando] = useState(false);
  const inputArquivo = useRef<HTMLInputElement>(null);
  const inputCamera = useRef<HTMLInputElement>(null);

  function receber(candidato: File | undefined) {
    if (!candidato) return;
    const problema = validarEncaminhamento(candidato);
    if (problema) {
      setErro(problema);
      return;
    }
    setErro(null);
    onChange(candidato);
  }

  function aoEscolher(evento: ChangeEvent<HTMLInputElement>) {
    receber(evento.target.files?.[0]);
    evento.target.value = ''; // permite escolher o mesmo arquivo de novo
  }

  function aoArrastarSobre(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setArrastando(true);
  }

  function aoSairDoArraste(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setArrastando(false);
  }

  function aoSoltar(evento: DragEvent<HTMLDivElement>) {
    evento.preventDefault();
    setArrastando(false);
    receber(evento.dataTransfer.files?.[0]);
  }

  return (
    <section className="correcao-card" aria-labelledby="titulo-novo-encaminhamento">
      <h2 id="titulo-novo-encaminhamento">Novo encaminhamento médico</h2>
      <p className="correcao-meta">
        Envie outro encaminhamento se a foto anterior estiver ilegível. Se você só trocar a OCS, pode deixar este campo vazio.
      </p>

      {/* Inputs ocultos: os botões visíveis os acionam. */}
      <input
        ref={inputArquivo}
        type="file"
        accept={ACEITOS}
        aria-label="Escolher arquivo do novo encaminhamento"
        style={{ display: 'none' }}
        onChange={aoEscolher}
      />
      <input
        ref={inputCamera}
        type="file"
        accept="image/*"
        capture="environment"
        aria-label="Tirar foto do novo encaminhamento"
        style={{ display: 'none' }}
        onChange={aoEscolher}
      />

      {arquivo ? (
        <div className="correcao-selecionado">
          <span>Selecionado · {arquivo.name}</span>
          <button type="button" className="botao" onClick={() => inputArquivo.current?.click()}>
            Trocar
          </button>
        </div>
      ) : (
        <div
          className={arrastando ? 'correcao-dropzone correcao-dropzone--ativa' : 'correcao-dropzone'}
          onDragOver={aoArrastarSobre}
          onDragLeave={aoSairDoArraste}
          onDrop={aoSoltar}
        >
          <p>Arraste e solte uma imagem ou PDF aqui, ou use os botões.</p>
          <div className="correcao-dropzone__botoes">
            <button type="button" className="botao" onClick={() => inputCamera.current?.click()}>
              Usar câmera
            </button>
            <button type="button" className="botao" onClick={() => inputArquivo.current?.click()}>
              Escolher arquivo
            </button>
          </div>
        </div>
      )}

      {erro && (
        <p role="alert" className="correcao-erro">
          {erro}
        </p>
      )}
    </section>
  );
}
