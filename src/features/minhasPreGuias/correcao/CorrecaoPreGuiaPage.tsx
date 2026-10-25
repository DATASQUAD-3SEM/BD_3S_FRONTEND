import { useEffect, useRef, useState } from 'react';
import { ApiError } from '../../../shared/api/http';
import StatusBadge from '../StatusBadge';
import { formatarData } from '../formatters';
import ViewerEncaminhamento from '../../preGuiaSetor/components/ViewerEncaminhamento';
import CartaoOcs from './components/CartaoOcs';
import CartaoNovoEncaminhamento from './components/CartaoNovoEncaminhamento';
import { correcaoApi as apiPadrao } from './correcaoApi';
import type { CorrecaoApi, CorrecaoPreGuia } from './types';
import './correcao.css';

interface Props {
  id: number;
  api?: CorrecaoApi;
  /** Volta para Minhas pré-guias sem alterar nada. */
  onVoltar: () => void;
  /** Pré-guia que o beneficiário não pode corrigir (403 ou 409 ao abrir): volta para a lista. */
  onNaoElegivel: () => void;
  /** Reenvio aceito: volta para a lista com a mensagem de confirmação. */
  onReenviado: (mensagem: string) => void;
}

type Estado = 'carregando' | 'pronto' | 'erro' | 'nao-encontrada';

/** T9-FE · Tela "Pré-guia {número}" em correção (só para pré-guia do próprio beneficiário em Atenção). */
export default function CorrecaoPreGuiaPage({
  id,
  api = apiPadrao,
  onVoltar,
  onNaoElegivel,
  onReenviado,
}: Props) {
  const [estado, setEstado] = useState<Estado>('carregando');
  const [tentativa, setTentativa] = useState(0);
  const [correcao, setCorrecao] = useState<CorrecaoPreGuia | null>(null);
  const [ocsId, setOcsId] = useState<number | null>(null);
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [urlEncaminhamento, setUrlEncaminhamento] = useState<string | null>(null);
  const [erroEncaminhamento, setErroEncaminhamento] = useState(false);
  const [enviando, setEnviando] = useState(false);
  const [erroEnvio, setErroEnvio] = useState<string | null>(null);
  const [confirmandoCancelamento, setConfirmandoCancelamento] = useState(false);
  // Ref (e não só estado) para barrar duplo clique antes do re-render.
  const enviandoRef = useRef(false);

  // A rota passa uma função nova a cada render. Guardá-la em ref evita recarregar a tela por isso.
  const naoElegivelRef = useRef(onNaoElegivel);
  useEffect(() => {
    naoElegivelRef.current = onNaoElegivel;
  }, [onNaoElegivel]);

  useEffect(() => {
    let cancelado = false;
    api
      .obterCorrecao(id)
      .then((dados) => {
        if (cancelado) return;
        setCorrecao(dados);
        setOcsId(dados.ocsAtual.id);
        setEstado('pronto');
      })
      .catch((erro: unknown) => {
        if (cancelado) return;
        if (erro instanceof ApiError && (erro.status === 403 || erro.status === 409)) {
          naoElegivelRef.current();
        } else if (erro instanceof ApiError && erro.status === 404) {
          setEstado('nao-encontrada');
        } else {
          setEstado('erro');
        }
      });
    return () => {
      cancelado = true;
    };
  }, [api, id, tentativa]);

  useEffect(() => {
    if (estado !== 'pronto') return;
    let cancelado = false;
    let url: string | null = null;
    api
      .buscarEncaminhamento(id)
      .then((blob) => {
        if (cancelado) return;
        url = URL.createObjectURL(blob);
        setUrlEncaminhamento(url);
      })
      .catch(() => {
        if (!cancelado) setErroEncaminhamento(true);
      });
    return () => {
      cancelado = true;
      if (url) URL.revokeObjectURL(url);
    };
  }, [api, id, estado]);

  if (estado === 'carregando') {
    return (
      <section className="correcao-pagina" aria-busy="true">
        <h1>Pré-guia</h1>
        <p role="status">Carregando pré-guia…</p>
      </section>
    );
  }

  if (estado === 'erro') {
    return (
      <section className="correcao-pagina">
        <h1>Pré-guia</h1>
        <div role="alert" className="estado-erro">
          <p>Não foi possível carregar esta pré-guia.</p>
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
      </section>
    );
  }

  if (estado === 'nao-encontrada' || !correcao || ocsId === null) {
    return (
      <section className="correcao-pagina">
        <h1>Pré-guia não encontrada</h1>
        <div className="estado-vazio">
          <p>Ela não existe ou não pertence à sua conta.</p>
          <button type="button" className="botao botao-primario" onClick={onVoltar}>
            Voltar para Minhas pré-guias
          </button>
        </div>
      </section>
    );
  }

  const ocsAlterada = ocsId !== correcao.ocsAtual.id;
  const alterou = ocsAlterada || arquivo !== null;
  const podeReenviar = alterou && !enviando;
  const ehImagem = correcao.encaminhamentoAtual.tipo.startsWith('image/');
  const rotuloEnvio = ehImagem ? 'Foto enviada' : 'PDF enviado';
  const legenda = `${rotuloEnvio} em ${formatarData(correcao.encaminhamentoAtual.dataEnvio)} (${ehImagem ? 'a que' : 'o que'} o setor marcou como ilegível)`;

  async function reenviar() {
    if (enviandoRef.current || !podeReenviar || !correcao || ocsId === null) return;
    enviandoRef.current = true;
    setEnviando(true);
    setErroEnvio(null);
    let aceito = false;
    try {
      await api.reenviar(id, {
        ocsId: ocsAlterada ? ocsId : undefined,
        arquivo: arquivo ?? undefined,
      });
      aceito = true;
      // Reenvio aceito: a tela está saindo, então o botão continua travado.
      onReenviado(`Pré-guia ${correcao.numero} reenviada ao setor de Guias. Ela voltou para Pendente.`);
    } catch (erro) {
      if (erro instanceof ApiError && erro.status === 409) {
        setErroEnvio('Esta pré-guia já foi alterada. Atualize a página para ver a situação atual.');
      } else {
        setErroEnvio(erro instanceof Error && erro.message ? erro.message : 'Não foi possível reenviar a pré-guia.');
      }
    } finally {
      if (!aceito) {
        enviandoRef.current = false;
        setEnviando(false);
      }
    }
  }

  function cancelar() {
    if (alterou) {
      setConfirmandoCancelamento(true);
    } else {
      onVoltar();
    }
  }

  return (
    <section className="correcao-pagina">
      <header className="correcao-topo">
        <h1>Pré-guia {correcao.numero}</h1>
        <StatusBadge status="ATENCAO" />
      </header>

      <div className="correcao-grade">
        <div className="correcao-coluna">
          <section className="correcao-card correcao-observacao" aria-labelledby="titulo-observacao">
            <h2 id="titulo-observacao">Observação do setor de Guias</h2>
            <p>{correcao.observacao.texto}</p>
            <p className="correcao-meta">Registrada em {formatarData(correcao.observacao.dataRegistro)}</p>
          </section>

          <section className="correcao-card" aria-labelledby="titulo-dados">
            <h2 id="titulo-dados">Dados da pré-guia</h2>
            <dl>
              <dt>Beneficiário</dt>
              <dd>{correcao.beneficiario.nome}</dd>
              <dt>Prec CP</dt>
              <dd>{correcao.beneficiario.precCp}</dd>
              <dt>Criada em</dt>
              <dd>{formatarData(correcao.dataCriacao)}</dd>
            </dl>
          </section>

          <CartaoOcs
            ocsAtualId={correcao.ocsAtual.id}
            valor={ocsId}
            onChange={setOcsId}
            buscar={api.buscarOcs}
          />

          <CartaoNovoEncaminhamento arquivo={arquivo} onChange={setArquivo} />
        </div>

        <div className="correcao-coluna">
          <section className="correcao-card" aria-labelledby="titulo-encaminhamento">
            <h2 id="titulo-encaminhamento">Encaminhamento enviado</h2>
            <ViewerEncaminhamento
              url={urlEncaminhamento}
              tipo={correcao.encaminhamentoAtual.tipo}
              nome={correcao.encaminhamentoAtual.nome}
              erro={erroEncaminhamento}
            />
            <p className="correcao-meta">{legenda}</p>
          </section>
        </div>
      </div>

      <section className="correcao-acoes" aria-label="Ações da correção">
        <p className="correcao-meta">
          A mesma pré-guia volta para Pendente. O histórico guarda as duas fotos e a observação do setor.
        </p>

        {erroEnvio && (
          <p role="alert" className="correcao-erro">
            {erroEnvio}
          </p>
        )}

        {confirmandoCancelamento && (
          <div className="correcao-confirma">
            <p>Descartar as alterações? Nada será enviado ao setor de Guias.</p>
            <div className="correcao-acoes__botoes">
              <button type="button" className="botao" onClick={() => setConfirmandoCancelamento(false)}>
                Continuar editando
              </button>
              <button type="button" className="botao botao-atencao" onClick={onVoltar}>
                Descartar e voltar
              </button>
            </div>
          </div>
        )}

        <div className="correcao-acoes__botoes">
          <button type="button" className="botao botao-primario" disabled={!podeReenviar} onClick={reenviar}>
            {enviando ? 'Reenviando…' : 'Reenviar ao setor de Guias'}
          </button>
          <button type="button" className="botao" disabled={enviando} onClick={cancelar}>
            Cancelar
          </button>
        </div>
      </section>
    </section>
  );
}
