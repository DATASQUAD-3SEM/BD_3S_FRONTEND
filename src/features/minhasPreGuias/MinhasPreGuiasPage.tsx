import { useEffect, useState } from 'react';
import PreGuiaCard from './PreGuiaCard';
import { minhasPreGuiasApi } from './api';
import type { MinhasPreGuiasApi, PreGuiaDoBeneficiario } from './types';
import './minhasPreGuias.css';

/**
 * Tela 1 - Minhas pre-guias do beneficiario (T1-FE): um cartao por pre-guia, da mais recente para a mais antiga,
 * com os estados de carregando, lista vazia e erro.
 */

interface Props {
  api?: MinhasPreGuiasApi;
  onVisualizarECorrigir?: (id: number) => void;
  onNovaPreGuia?: () => void;
}

type Estado = 'carregando' | 'pronto' | 'erro';

export default function MinhasPreGuiasPage({
  api = minhasPreGuiasApi,
  onVisualizarECorrigir,
  onNovaPreGuia,
}: Props) {
  const [estado, setEstado] = useState<Estado>('carregando');
  const [preGuias, setPreGuias] = useState<PreGuiaDoBeneficiario[]>([]);
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    api
      .listar()
      .then((lista) => {
        if (cancelado) return;
        const ordenada = [...lista].sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao));
        setPreGuias(ordenada);
        setEstado('pronto');
      })
      .catch(() => {
        if (cancelado) return;
        setEstado('erro');
      });
    return () => {
      cancelado = true;
    };
  }, [api, tentativa]);

  const tentarNovamente = () => {
    setEstado('carregando');
    setTentativa((n) => n + 1);
  };

  return (
    <section className="minhas-pre-guias">
      <h1>Minhas pré-guias</h1>

      {estado === 'carregando' && (
        <div data-testid="skeleton" aria-busy="true" aria-label="Carregando pré-guias">
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton-card" />
          ))}
        </div>
      )}

      {estado === 'erro' && (
        <div role="alert" className="estado-erro">
          <p>Não foi possível carregar suas pré-guias.</p>
          <button type="button" className="botao botao-primario" onClick={tentarNovamente}>
            Tentar novamente
          </button>
        </div>
      )}

      {estado === 'pronto' && preGuias.length === 0 && (
        <div className="estado-vazio">
          <p>Você ainda não tem pré-guias.</p>
          <button type="button" className="botao botao-primario" onClick={() => onNovaPreGuia?.()}>
            Nova pré-guia
          </button>
        </div>
      )}

      {estado === 'pronto' &&
        preGuias.map((p) => (
          <PreGuiaCard key={p.id} preGuia={p} api={api} onVisualizarECorrigir={onVisualizarECorrigir} />
        ))}
    </section>
  );
}
