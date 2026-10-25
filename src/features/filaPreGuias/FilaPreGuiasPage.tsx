import { useCallback, useEffect, useRef, useState } from 'react';
import StatusBadge, { STATUS } from './StatusBadge';
import { filaPreGuiasApi } from './api';
import { formatarDiaMes, ORIGEM } from './formatters';
import type { FilaPreGuiasApi, PaginaFila, StatusPreGuia } from './types';
import './filaPreGuias.css';

const TAMANHO_PAGINA = 10;
const ATRASO_BUSCA_MS = 300;

interface Props {
  api?: FilaPreGuiasApi;
  onAbrir?: (id: number) => void;
}

type Estado = 'carregando' | 'pronto' | 'erro';

export default function FilaPreGuiasPage({ api = filaPreGuiasApi, onAbrir }: Props) {
  const [busca, setBusca] = useState('');
  const [buscaAplicada, setBuscaAplicada] = useState('');
  const [status, setStatus] = useState<StatusPreGuia | ''>('');
  const [pagina, setPagina] = useState(0);
  const [estado, setEstado] = useState<Estado>('carregando');
  const [resultado, setResultado] = useState<Pick<PaginaFila, 'total' | 'itens'>>({ total: 0, itens: [] });
  const [tentativa, setTentativa] = useState(0);
  const requisicao = useRef(0);

  // Espera 300 ms sem digitar antes de buscar; uma nova busca volta para a primeira página.
  useEffect(() => {
    const id = setTimeout(() => {
      if (busca !== buscaAplicada) {
        setBuscaAplicada(busca);
        setPagina(0);
      }
    }, ATRASO_BUSCA_MS);
    return () => clearTimeout(id);
  }, [busca, buscaAplicada]);

  useEffect(() => {
    const numero = ++requisicao.current;
    api
      .listar({ busca: buscaAplicada, status, page: pagina, size: TAMANHO_PAGINA })
      .then((dados) => {
        if (numero !== requisicao.current) return; // resposta de uma consulta antiga
        setResultado(dados);
        setEstado('pronto');
      })
      .catch(() => {
        if (numero !== requisicao.current) return;
        setEstado('erro');
      });
  }, [api, buscaAplicada, status, pagina, tentativa]);

  const tentarNovamente = useCallback(() => {
    setEstado('carregando');
    setTentativa((n) => n + 1);
  }, []);

  const aoMudarStatus = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatus(e.target.value as StatusPreGuia | '');
    setPagina(0);
  };

  const totalPaginas = Math.max(1, Math.ceil(resultado.total / TAMANHO_PAGINA));

  return (
    <section className="fila-pre-guias">
      <h1>Fila de pré-guias</h1>

      <div className="fila-pre-guias__painel">
        <div className="fila-pre-guias__filtros">
          <input
            type="search"
            aria-label="Buscar por beneficiário ou Prec CP"
            placeholder="Buscar por beneficiário ou Prec CP"
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
          />
          <select aria-label="Filtrar por status" value={status} onChange={aoMudarStatus}>
            <option value="">Todos os status</option>
            {(Object.entries(STATUS) as [StatusPreGuia, { rotulo: string }][]).map(([valor, info]) => (
              <option key={valor} value={valor}>
                {info.rotulo}
              </option>
            ))}
          </select>
        </div>

        {estado === 'carregando' && (
          <div data-testid="skeleton" aria-busy="true" aria-label="Carregando fila">
            {[1, 2, 3, 4].map((n) => (
              <div key={n} className="skeleton-linha" />
            ))}
          </div>
        )}

        {estado === 'erro' && (
          <div role="alert" className="estado-erro">
            <p>Não foi possível carregar a fila de pré-guias.</p>
            <button type="button" className="botao botao-primario" onClick={tentarNovamente}>
              Tentar novamente
            </button>
          </div>
        )}

        {estado === 'pronto' && resultado.itens.length === 0 && (
          <p className="estado-vazio">Nenhuma pré-guia encontrada</p>
        )}

        {estado === 'pronto' && resultado.itens.length > 0 && (
          <div className="fila-pre-guias__tabela-wrapper">
            <table className="fila-pre-guias__tabela">
              <thead>
                <tr>
                  <th>Nº</th>
                  <th>Beneficiário</th>
                  <th>OCS</th>
                  <th>Origem</th>
                  <th>Criada em</th>
                  <th>Status</th>
                  <th>
                    <span className="sr-only">Ações</span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {resultado.itens.map((p) => {
                  const destaque = p.status === 'PENDENTE' || p.status === 'EM_ANALISE';
                  return (
                    <tr key={p.id}>
                      <td>{p.numero}</td>
                      <td>{p.beneficiarioNome}</td>
                      <td>{p.ocsNome}</td>
                      <td>{ORIGEM[p.origem] ?? p.origem}</td>
                      <td>{formatarDiaMes(p.dataCriacao)}</td>
                      <td>
                        <StatusBadge status={p.status} />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={`botao ${destaque ? 'botao-primario' : ''}`}
                          aria-label={`Abrir pré-guia ${p.numero}`}
                          onClick={() => onAbrir?.(p.id)}
                        >
                          Abrir
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {estado === 'pronto' && totalPaginas > 1 && (
          <nav className="fila-pre-guias__paginacao" aria-label="Paginação">
            <button type="button" className="botao" disabled={pagina === 0} onClick={() => setPagina(pagina - 1)}>
              Anterior
            </button>
            <span>
              Página {pagina + 1} de {totalPaginas} · {resultado.total} pré-guias
            </span>
            <button
              type="button"
              className="botao"
              disabled={pagina + 1 >= totalPaginas}
              onClick={() => setPagina(pagina + 1)}
            >
              Próxima
            </button>
          </nav>
        )}
      </div>
    </section>
  );
}
