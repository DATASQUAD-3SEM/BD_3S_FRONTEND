import { useRef, useState, type ChangeEvent } from 'react';
import { somenteDigitos } from '../formatters';
import { ehPdf } from '../regras';
import type { GuiaRascunhoDetalhe } from '../types';

interface Props {
  numero: string;
  rascunho: GuiaRascunhoDetalhe | null;
  podeConcluir: boolean;
  enviandoAnexo: boolean;
  enviandoConclusao: boolean;
  onNumeroChange: (numero: string) => void;
  onAnexar: (pdf: File) => void;
  onConcluir: () => void;
}

/** Coluna "Gerar a Guia" (T4-FE). */
export default function ColunaGerarGuia({
                                          numero,
                                          rascunho,
                                          podeConcluir,
                                          enviandoAnexo,
                                          enviandoConclusao,
                                          onNumeroChange,
                                          onAnexar,
                                          onConcluir,
                                        }: Props) {
  const seletor = useRef<HTMLInputElement>(null);
  const [erro, setErro] = useState<string | null>(null);
  const numeroPreenchido = numero.trim() !== '';
  const numeroMudou = rascunho !== null && numeroPreenchido && numero.trim() !== rascunho.numero;

  const abrirSeletor = () => {
    if (!numeroPreenchido) {
      setErro('Informe o número da Guia antes de anexar o PDF.');
      return;
    }
    setErro(null);
    seletor.current?.click();
  };

  const aoEscolher = (evento: ChangeEvent<HTMLInputElement>) => {
    const arquivo = evento.target.files?.[0];
    evento.target.value = ''; // permite escolher o mesmo arquivo de novo
    if (!arquivo) return;
    if (!ehPdf(arquivo)) {
      setErro('Envie um arquivo PDF.');
      return;
    }
    setErro(null);
    onAnexar(arquivo);
  };

  return (
    <div className="pgs__coluna">
      <h3>Gerar a Guia</h3>
      <p className="pgs__pequeno">Emita a Guia no SIRE e anexe o PDF.</p>

      <label htmlFor="pgs-numero-guia">Número da Guia</label>
      <input
        id="pgs-numero-guia"
        className="pgs__campo"
        type="text"
        inputMode="numeric"
        autoComplete="off"
        value={numero}
        onChange={(e) => onNumeroChange(somenteDigitos(e.target.value))}
      />
      {numeroMudou && (
        <p className="pgs__pequeno">Anexe a Guia novamente para salvar o novo número.</p>
      )}

      {rascunho ? (
        <div className="pgs__anexo">
          <span className="pgs__pill">Anexada</span>
          <span className="pgs__nome-arquivo">{rascunho.nomeArquivo}</span>
          <button type="button" className="botao" disabled={enviandoAnexo} onClick={abrirSeletor}>
            {enviandoAnexo ? 'Enviando…' : 'Trocar'}
          </button>
        </div>
      ) : (
        <div>
          <button type="button" className="botao" disabled={enviandoAnexo} onClick={abrirSeletor}>
            {enviandoAnexo ? 'Enviando…' : 'Anexar Guia'}
          </button>
        </div>
      )}

      <input
        ref={seletor}
        type="file"
        accept="application/pdf,.pdf"
        className="sr-only"
        aria-label="Escolher PDF da Guia"
        tabIndex={-1}
        onChange={aoEscolher}
      />
      {erro && <p role="alert" className="pgs__erro">{erro}</p>}

      <button
        type="button"
        className="botao botao-primario pgs__concluir"
        disabled={!podeConcluir || enviandoConclusao}
        onClick={onConcluir}
      >
        {enviandoConclusao ? 'Concluindo…' : 'Concluir'}
      </button>
      <p className="pgs__pequeno">
        {podeConcluir
          ? 'Ao concluir, a Guia segue para a assinatura do médico e do chefe.'
          : 'Disponível depois de anexar a Guia.'}
      </p>
    </div>
  );
}
