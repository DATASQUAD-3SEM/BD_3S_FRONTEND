import { useState } from 'react';
import { LIMITE_OBSERVACAO } from '../regras';

interface Props {
  enviando: boolean;
  onConfirmar: (observacao: string) => Promise<void>;
}

/** Coluna "Não consegui coletar as informações" (T4-FE). */
export default function ColunaCorrecao({ enviando, onConfirmar }: Props) {
  const [observacao, setObservacao] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const texto = observacao.trim();
  const invalida = texto === '' || texto.length > LIMITE_OBSERVACAO;

  const confirmar = async () => {
    await onConfirmar(texto);
    setConfirmando(false);
  };

  return (
    <div className="pgs__coluna">
      <h3>Não consegui coletar as informações</h3>

      <label htmlFor="pgs-observacao">Observação (obrigatória)</label>
      <textarea
        id="pgs-observacao"
        className="pgs__campo"
        rows={5}
        value={observacao}
        onChange={(e) => setObservacao(e.target.value)}
      />
      <p className={`pgs__contador${texto.length > LIMITE_OBSERVACAO ? ' pgs__erro' : ''}`}>
        {texto.length}/{LIMITE_OBSERVACAO} caracteres
      </p>

      <div>
        <button
          type="button"
          className="botao"
          disabled={invalida || enviando}
          onClick={() => setConfirmando(true)}
        >
          Requerer correção
        </button>
      </div>

      {confirmando && (
        <div className="pgs-dialogo-fundo">
          <div role="dialog" aria-modal="true" aria-labelledby="pgs-dialogo-titulo" className="pgs-dialogo">
            <h3 id="pgs-dialogo-titulo">Requerer correção?</h3>
            <p>A pré-guia ficará com status Atenção e a observação abaixo será registrada no histórico.</p>
            <blockquote className="pgs-dialogo__observacao">{texto}</blockquote>
            <div className="pgs-dialogo__acoes">
              <button type="button" className="botao" disabled={enviando} onClick={() => setConfirmando(false)}>
                Cancelar
              </button>
              <button type="button" className="botao botao-primario" disabled={enviando} onClick={confirmar}>
                {enviando ? 'Enviando…' : 'Confirmar correção'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
