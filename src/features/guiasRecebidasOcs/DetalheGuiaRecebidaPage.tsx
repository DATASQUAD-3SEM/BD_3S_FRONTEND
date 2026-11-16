import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../../shared/api/http';
import { formatarData, formatarPrecCp } from '../../shared/utils/formatadores';
import GradeSessoes from './components/GradeSessoes';
import { guiasRecebidasApi } from './api';
import { guiaVencida } from './regras';
import type { GuiaRecebidaDetalhe, SessaoRecebida } from './types';
import './guiasRecebidas.css';

type Estado = 'carregando' | 'pronto' | 'nao-encontrada' | 'erro';

const MSG_CONFLITO = 'Esta sessão não pode ser requerida agora: a guia pode estar vencida ou a sessão já foi solicitada.';

function mensagemErroRequerer(erro: unknown): string {
  if (erro instanceof ApiError) {
    if (erro.status === 409) return MSG_CONFLITO;
    if (erro.status === 403) return 'Esta guia não é da sua OCS.';
    if (erro.status === 404) return 'Sessão não encontrada.';
  }
  return 'Não foi possível requerer a assinatura. Tente novamente.';
}

/**
 * Modelo digitalizado da guia recebida pela OCS (T19-FE-2), com o pedido de assinatura de uma sessao
 * por vez (T19-FE-3). O pedido so acontece com a guia dentro da validade.
 */
export default function DetalheGuiaRecebidaPage() {
  const { id } = useParams();
  const idGuia = Number(id);
  const [estado, setEstado] = useState<Estado>('carregando');
  const [guia, setGuia] = useState<GuiaRecebidaDetalhe | null>(null);
  const [tentativa, setTentativa] = useState(0);
  const [selecionada, setSelecionada] = useState<SessaoRecebida | null>(null);
  const [enviando, setEnviando] = useState(false);
  const [mensagem, setMensagem] = useState<string | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);

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

  const vencida = guia ? guiaVencida(guia.validadeAte) : false;

  // Clicar na sessao selecionada de novo desmarca; clicar em outra troca a selecao (so uma por vez).
  function selecionar(sessao: SessaoRecebida) {
    setErroAcao(null);
    setSelecionada((atual) => (atual?.id === sessao.id ? null : sessao));
  }

  async function requererAssinatura() {
    if (!guia || !selecionada) return;
    const sessao = selecionada;
    setEnviando(true);
    setErroAcao(null);
    setMensagem(null);
    try {
      const atualizada = await guiasRecebidasApi.solicitarAssinatura(guia.id, sessao.id);
      setGuia(atualizada);
      setSelecionada(null);
      const procedimento = guia.procedimentos.find((p) => p.codDgp === sessao.procedimento)?.descricao ?? sessao.procedimento;
      setMensagem(
        `Assinatura requerida para a sessão ${sessao.numero} de ${procedimento}. O beneficiário assina em Minhas guias.`,
      );
    } catch (erro) {
      setErroAcao(mensagemErroRequerer(erro));
      setSelecionada(null);
      if (erro instanceof ApiError && erro.status === 409) {
        // Recarrega para a grade mostrar o estado real da guia e das sessoes
        guiasRecebidasApi.buscarDetalhe(guia.id).then(setGuia).catch(() => undefined);
      }
    } finally {
      setEnviando(false);
    }
  }

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

            {vencida && (
              <p role="status" className="gr-banner-vencida">
                Guia vencida em {formatarData(guia.validadeAte)}. Não aceita novas solicitações de sessão.
              </p>
            )}

            <GradeSessoes
              procedimentos={guia.procedimentos}
              sessoes={guia.sessoes}
              selecionadaId={selecionada?.id ?? null}
              onSelecionar={selecionar}
              vencida={vencida}
            />

            <div className="gr-requerer">
              <button
                type="button"
                className="botao botao-primario"
                disabled={!selecionada || vencida || enviando}
                onClick={requererAssinatura}
              >
                {enviando ? 'Requerendo…' : 'Requerer assinatura'}
              </button>
            </div>

            {mensagem && (
              <p role="status" className="gr-mensagem-ok">
                {mensagem}
              </p>
            )}
            {erroAcao && (
              <p role="alert" className="gr-mensagem-erro">
                {erroAcao}
              </p>
            )}
          </section>
        </>
      )}
    </section>
  );
}
