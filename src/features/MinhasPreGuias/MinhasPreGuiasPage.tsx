import { useCallback, useEffect, useState } from 'react';
import PreGuiaCard from './PreGuiaCard';
import { minhasPreGuiasApi } from './api';
import type { MinhasPreGuiasApi, PreGuiaDoBeneficiario } from './types';
import './minhasPreGuias.css';


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

  const carregar = useCallback(async () => {
    setEstado('carregando');
    try {
      const lista = await api.listar();
      const ordenada = [...lista].sort((a, b) => b.dataCriacao.localeCompare(a.dataCriacao));
      setPreGuias(ordenada);
      setEstado('pronto');
    } catch {
      setEstado('erro');
    }
  }, [api]);

  useEffect(() => {
    carregar();
  }, [carregar]);

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
          <button type="button" className="botao botao-primario" onClick={carregar}>
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
