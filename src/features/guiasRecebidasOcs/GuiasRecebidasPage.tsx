import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SituacaoGuiaBadge from '../minhasGuias/SituacaoGuiaBadge';
import { formatarData, formatarPrecCp } from '../../shared/utils/formatadores';
import { guiasRecebidasApi } from './api';
import { filtrarGuias } from './regras';
import type { GuiaRecebida } from './types';
import './guiasRecebidas.css';

type Estado = 'carregando' | 'pronto' | 'erro';

/** Lista "Guias recebidas" da OCS (T19-FE-1). */
export default function GuiasRecebidasPage() {
  const [estado, setEstado] = useState<Estado>('carregando');
  const [guias, setGuias] = useState<GuiaRecebida[]>([]);
  const [termo, setTermo] = useState('');
  const [tentativa, setTentativa] = useState(0);

  useEffect(() => {
    let cancelado = false;
    guiasRecebidasApi
      .listar()
      .then((lista) => {
        if (cancelado) return;
        setGuias(lista);
        setEstado('pronto');
      })
      .catch(() => {
        if (cancelado) return;
        setEstado('erro');
      });
    return () => {
      cancelado = true;
    };
  }, [tentativa]);

  function tentarNovamente() {
    setEstado('carregando');
    setTentativa((n) => n + 1);
  }

  const visiveis = filtrarGuias(guias, termo);

  return (
    <section className="gr-pagina">
      <h1>Guias recebidas</h1>
      <p className="gr-subtitulo">Guias enviadas pelos beneficiários para a sua OCS.</p>

      {estado === 'carregando' && (
        <div data-testid="skeleton-guias" aria-busy="true" aria-label="Carregando guias recebidas">
          {[1, 2].map((n) => (
            <div key={n} className="gr-skeleton" />
          ))}
        </div>
      )}

      {estado === 'erro' && (
        <div role="alert" className="estado-erro">
          <p>Não foi possível carregar as guias recebidas.</p>
          <button type="button" className="botao botao-primario" onClick={tentarNovamente}>
            Tentar novamente
          </button>
        </div>
      )}

      {estado === 'pronto' && guias.length === 0 && <p className="gr-vazio">Nenhuma guia recebida.</p>}

      {estado === 'pronto' && guias.length > 0 && (
        <>
          <div className="gr-busca">
            <label htmlFor="gr-busca">Buscar guia</label>
            <input
              id="gr-busca"
              type="search"
              autoComplete="off"
              placeholder="Nome, número da guia ou Prec CP"
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
            />
          </div>

          {visiveis.length === 0 ? (
            <p className="gr-vazio">Nenhuma guia encontrada para a busca.</p>
          ) : (
            <div className="gr-tabela-area">
              <table className="gr-tabela">
                <thead>
                  <tr>
                    <th scope="col">Guia</th>
                    <th scope="col">Beneficiário</th>
                    <th scope="col">Prec CP</th>
                    <th scope="col">Procedimento</th>
                    <th scope="col">Enviada em</th>
                    <th scope="col">Situação</th>
                    <th scope="col">
                      <span className="sr-only">Ações</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visiveis.map((guia) => (
                    <tr key={guia.id}>
                      <td>{guia.numero}</td>
                      <td>{guia.beneficiario.nome}</td>
                      <td>{formatarPrecCp(guia.beneficiario.precCp)}</td>
                      <td>
                        {guia.procedimentos.map((p) => (
                          <div key={p.codDgp}>{p.descricao}</div>
                        ))}
                      </td>
                      <td>{formatarData(guia.dataEnvio)}</td>
                      <td>
                        <SituacaoGuiaBadge situacao={guia.situacao} />
                      </td>
                      <td>
                        <Link className="botao" to={`/ocs/guias-recebidas/${guia.id}`}>
                          Abrir
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}
