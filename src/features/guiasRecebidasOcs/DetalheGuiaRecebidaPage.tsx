import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../../shared/api/http';
import { formatarData, formatarPrecCp } from '../../shared/utils/formatadores';
import GradeSessoes from './components/GradeSessoes';
import { guiasRecebidasApi } from './api';
import type { GuiaRecebidaDetalhe } from './types';
import './guiasRecebidas.css';

type Estado = 'carregando' | 'pronto' | 'nao-encontrada' | 'erro';

/** Modelo digitalizado da guia recebida pela OCS (T19-FE-2). Somente leitura. */
export default function DetalheGuiaRecebidaPage() {
  const { id } = useParams();
  const idGuia = Number(id);
  const [estado, setEstado] = useState<Estado>('carregando');
  const [guia, setGuia] = useState<GuiaRecebidaDetalhe | null>(null);
  const [tentativa, setTentativa] = useState(0);

  const idValido = Number.isInteger(idGuia) && idGuia > 0;
  // Id invalido na rota nao chama a API: a tela ja mostra "nao encontrada".
  const exibido: Estado = idValido ? estado : 'nao-encontrada';

  useEffect(() => {
    if (!idValido) return;
    let cancelado = false;
    guiasRecebidasApi
      .buscarDetalhe(idGuia)
      .then((dados) => {
        if (cancelado) return;
        setGuia(dados);
        setEstado('pronto');
      })
      .catch((erro: unknown) => {
        if (cancelado) return;
        setEstado(erro instanceof ApiError && erro.status === 404 ? 'nao-encontrada' : 'erro');
      });
    return () => {
      cancelado = true;
    };
  }, [idGuia, idValido, tentativa]);

  return (
    <section className="gr-pagina">
      <Link className="gr-voltar" to="/ocs/guias-recebidas">
        ← Guias recebidas
      </Link>

      {exibido === 'carregando' && (
        <div aria-busy="true" aria-label="Carregando guia">
          <div className="gr-skeleton" />
          <div className="gr-skeleton" />
        </div>
      )}

      {exibido === 'nao-encontrada' && (
        <div className="estado-erro">
          <p>Guia não encontrada.</p>
        </div>
      )}

      {exibido === 'erro' && (
        <div role="alert" className="estado-erro">
          <p>Não foi possível carregar a guia.</p>
          <button
            type="button"
            className="botao botao-primario"
            onClick={() => {
              setEstado('carregando');
              setTentativa((n) => n + 1);
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {exibido === 'pronto' && guia && (
        <>
          <h1>Guia {guia.numero}</h1>

          <section className="gr-cartao" aria-labelledby="gr-dados">
            <h2 id="gr-dados">Dados da guia (lidos do PDF)</h2>
            <dl className="gr-dados">
              <div>
                <dt>Número da guia</dt>
                <dd>{guia.numero}</dd>
              </div>
              <div>
                <dt>Validade (NÃO RECEBER APÓS)</dt>
                <dd>{formatarData(guia.validadeAte)}</dd>
              </div>
              <div>
                <dt>Beneficiário</dt>
                <dd>{guia.beneficiario.nome}</dd>
              </div>
              <div>
                <dt>Prec CP</dt>
                <dd>{formatarPrecCp(guia.beneficiario.precCp)}</dd>
              </div>
            </dl>
          </section>

          <section className="gr-cartao" aria-labelledby="gr-procedimentos">
            <h2 id="gr-procedimentos">Procedimentos autorizados</h2>
            <div className="gr-tabela-area">
              <table className="gr-tabela">
                <thead>
                  <tr>
                    <th scope="col">Código</th>
                    <th scope="col">Procedimento</th>
                    <th scope="col">Quantidade</th>
                  </tr>
                </thead>
                <tbody>
                  {guia.procedimentos.map((p) => (
                    <tr key={p.codDgp}>
                      <td>{p.codDgp}</td>
                      <td>{p.descricao}</td>
                      <td>{p.quantidade}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="gr-cartao" aria-labelledby="gr-sessoes">
            <h2 id="gr-sessoes">Sessões</h2>
            <GradeSessoes procedimentos={guia.procedimentos} sessoes={guia.sessoes} />
          </section>
        </>
      )}
    </section>
  );
}
