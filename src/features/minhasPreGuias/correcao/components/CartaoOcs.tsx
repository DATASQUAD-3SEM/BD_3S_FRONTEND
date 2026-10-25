import { useEffect, useState } from 'react';
import type { OcsBusca } from '../types';

const ATRASO_BUSCA_MS = 300;

interface Props {
  /** OCS que a pré-guia já tem. Aparece marcada como "(atual)". */
  ocsAtualId: number;
  /** OCS escolhida agora (igual à atual quando nada mudou). */
  valor: number | null;
  onChange: (ocsId: number) => void;
  buscar: (busca: string) => Promise<OcsBusca[]>;
}

interface ResultadoBusca {
  termo: string;
  lista: OcsBusca[];
  erro: boolean;
}

export function rotuloOcs(ocs: OcsBusca): string {
  return `${ocs.nome} · Contrato: ${ocs.contrato} · ${ocs.tipo.toUpperCase()}`;
}

/** Cartão "OCS" da correção: busca com debounce e escolha por radio (T9-FE). */
export default function CartaoOcs({ ocsAtualId, valor, onChange, buscar }: Props) {
  const [digitado, setDigitado] = useState('');
  const [termo, setTermo] = useState('');
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null);
  const [tentativa, setTentativa] = useState(0);

  // Resultado só vale para o termo atual; enquanto não chega, está "carregando".
  const atual = resultado !== null && resultado.termo === termo ? resultado : null;

  // Só dispara a busca quando o usuário para de digitar por 300 ms.
  useEffect(() => {
    const timer = setTimeout(() => setTermo(digitado.trim()), ATRASO_BUSCA_MS);
    return () => clearTimeout(timer);
  }, [digitado]);

  useEffect(() => {
    let cancelado = false;
    buscar(termo)
      .then((lista) => {
        if (!cancelado) setResultado({ termo, lista, erro: false });
      })
      .catch(() => {
        if (!cancelado) setResultado({ termo, lista: [], erro: true });
      });
    return () => {
      cancelado = true;
    };
  }, [termo, buscar, tentativa]);

  return (
    <section className="correcao-card" aria-labelledby="titulo-ocs">
      <h2 id="titulo-ocs">OCS</h2>
      <p className="correcao-meta">
        Altere somente se a observação indicar problema com a OCS (por exemplo, 'OCS inexistente').
      </p>

      <label htmlFor="busca-ocs-correcao">Buscar OCS</label>
      <input
        id="busca-ocs-correcao"
        type="text"
        className="correcao-busca"
        placeholder="Nome, contrato ou tipo"
        value={digitado}
        onChange={(e) => setDigitado(e.target.value)}
      />

      {atual === null && <p role="status">Buscando OCS…</p>}

      {atual?.erro && (
        <div role="alert" className="correcao-erro">
          <p>Não foi possível buscar as OCS.</p>
          <button
            type="button"
            className="botao"
            onClick={() => {
              setResultado(null);
              setTentativa((n) => n + 1);
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {atual && !atual.erro && atual.lista.length === 0 && <p>Nenhuma OCS encontrada.</p>}

      {atual && !atual.erro && atual.lista.length > 0 && (
        <ul className="correcao-opcoes">
          {atual.lista.map((ocs) => (
            <li key={ocs.id}>
              <label>
                <input
                  type="radio"
                  name="ocs-correcao"
                  value={ocs.id}
                  checked={valor === ocs.id}
                  onChange={() => onChange(ocs.id)}
                />
                <span>
                  {rotuloOcs(ocs)}
                  {ocs.id === ocsAtualId && <strong> (atual)</strong>}
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
