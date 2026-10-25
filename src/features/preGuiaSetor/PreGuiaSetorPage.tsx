import { useEffect, useState } from 'react';
import StatusBadge from '../filaPreGuias/StatusBadge';
import { preGuiaSetorApi } from './api';
import ColunaCorrecao from './components/ColunaCorrecao';
import ColunaGerarGuia from './components/ColunaGerarGuia';
import ViewerEncaminhamento from './components/ViewerEncaminhamento';
import { formatarExame, formatarPrecCp, textoCriadaPor } from './formatters';
import {
  ehNaoEncontrada,
  mensagemDeErro,
  podeConcluirGuia,
  situacaoDecisao,
  type OpcoesMensagemErro,
} from './regras';
import type { DetalhePreGuia, PreGuiaSetorApi } from './types';
import './preGuiaSetor.css';

interface Props {
  id: number;
  api?: PreGuiaSetorApi;
  onVoltarFila?: () => void;
}

type Carga = 'carregando' | 'pronto' | 'nao-encontrada' | 'erro';
type Acao = 'correcao' | 'anexo' | 'conclusao';

/** Tela "Pré-guia {número}" do Setor de Guias (T4-FE). */
export default function PreGuiaSetorPage({ id, api = preGuiaSetorApi, onVoltarFila }: Props) {
  const [detalhe, setDetalhe] = useState<DetalhePreGuia | null>(null);
  const [carga, setCarga] = useState<Carga>('carregando');
  const [versao, setVersao] = useState(0);
  const [acao, setAcao] = useState<Acao | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [numeroDigitado, setNumeroDigitado] = useState<string | null>(null);
  const [urlEncaminhamento, setUrlEncaminhamento] = useState<string | null>(null);
  const [erroEncaminhamento, setErroEncaminhamento] = useState(false);

  const idAtual = detalhe?.id;
  const statusAtual = detalhe?.status;
  const temEncaminhamento = detalhe?.encaminhamento != null;

  // Carrega a pré-guia; "versao" força uma nova leitura depois de cada ação.
  useEffect(() => {
    let ativo = true;
    api
      .detalhar(id)
      .then((dados) => {
        if (!ativo) return;
        setDetalhe(dados);
        setCarga('pronto');
      })
      .catch((erro: unknown) => {
        if (ativo) setCarga(ehNaoEncontrada(erro) ? 'nao-encontrada' : 'erro');
      });
    return () => {
      ativo = false;
    };
  }, [api, id, versao]);

  // Ao carregar uma pré-guia Pendente, abre a análise (T4-BE3). O backend é idempotente.
  useEffect(() => {
    if (idAtual === undefined || statusAtual !== 'PENDENTE') return;
    let ativo = true;
    api
      .abrir(idAtual)
      .then(({ status }) => {
        if (ativo) setDetalhe((atual) => (atual ? { ...atual, status } : atual));
      })
      .catch((erro: unknown) => {
        if (ativo) setErroAcao(mensagemDeErro(erro, { padrao: 'Não foi possível abrir a pré-guia.' }));
      });
    return () => {
      ativo = false;
    };
  }, [api, idAtual, statusAtual]);

  // Baixa o encaminhamento (foto ou PDF) como blob e libera a URL ao sair.
  useEffect(() => {
    if (idAtual === undefined || !temEncaminhamento) return;
    let ativo = true;
    let url: string | null = null;
    api
      .buscarEncaminhamento(idAtual)
      .then((blob) => {
        if (!ativo) return;
        url = URL.createObjectURL(blob);
        setUrlEncaminhamento(url);
      })
      .catch(() => {
        if (ativo) setErroEncaminhamento(true);
      });
    return () => {
      ativo = false;
      if (url) URL.revokeObjectURL(url);
    };
  }, [api, idAtual, temEncaminhamento]);

  if (carga === 'nao-encontrada') {
    return (
      <section className="pgs pgs--centro">
        <h1>Pré-guia não encontrada</h1>
        <p>Ela pode ter sido removida ou o endereço está incorreto.</p>
        {onVoltarFila && (
          <button type="button" className="botao botao-primario" onClick={onVoltarFila}>
            Voltar para a fila
          </button>
        )}
      </section>
    );
  }

  if (carga === 'erro') {
    return (
      <section className="pgs pgs--centro">
        <p role="alert">Não foi possível carregar a pré-guia.</p>
        <button
          type="button"
          className="botao botao-primario"
          onClick={() => {
            setCarga('carregando');
            setVersao((v) => v + 1);
          }}
        >
          Tentar novamente
        </button>
      </section>
    );
  }

  if (carga === 'carregando' || detalhe === null) {
    return (
      <section className="pgs" aria-busy="true" aria-label="Carregando pré-guia">
        <div className="skeleton-linha" />
        <div className="skeleton-linha" />
        <div className="skeleton-linha" />
      </section>
    );
  }

  const numeroGuia = numeroDigitado ?? detalhe.guiaRascunho?.numero ?? '';
  const situacao = situacaoDecisao(detalhe);
  const ativa = situacao === 'ativa';
  const origemMedico = detalhe.origem === 'MEDICO';

  // Executa uma ação, mostra o erro se houver e sempre recarrega a pré-guia.
  const executar = async (tipo: Acao, operacao: () => Promise<unknown>, opcoes: OpcoesMensagemErro) => {
    setAcao(tipo);
    setErroAcao(null);
    try {
      await operacao();
    } catch (erro) {
      setErroAcao(mensagemDeErro(erro, opcoes));
    } finally {
      setAcao(null);
      setVersao((v) => v + 1);
    }
  };

  const requererCorrecao = (observacao: string) =>
    executar('correcao', () => api.requererCorrecao(detalhe.id, observacao), {
      padrao: 'Não foi possível requerer a correção.',
    });

  const anexarGuia = (pdf: File) =>
    executar('anexo', () => api.anexarGuia(detalhe.id, numeroGuia.trim(), pdf), {
      padrao: 'Não foi possível anexar a Guia.',
    });

  const concluirGuia = () =>
    executar('conclusao', () => api.concluirGuia(detalhe.id), {
      padrao: 'Não foi possível concluir a Guia.',
      conflito: 'Não foi possível concluir: confira se a Guia está anexada e se ela ainda não foi enviada.',
    });

  return (
    <section className="pgs" aria-labelledby="pgs-titulo">
      <div className="pgs__cabecalho">
        <h1 id="pgs-titulo">Pré-guia {detalhe.numero}</h1>
        <StatusBadge status={detalhe.status} />
      </div>

      {erroAcao && <p role="alert" className="pgs__alerta">{erroAcao}</p>}

      <div className="pgs__grade">
        <div className="pgs__coluna-principal">
          <section className="pgs__cartao" aria-labelledby="pgs-dados">
            <h2 id="pgs-dados">Dados</h2>
            <dl className="pgs__dados">
              <div>
                <dt>Beneficiário</dt>
                <dd>{detalhe.beneficiario.nome}</dd>
              </div>
              <div>
                <dt>Prec CP</dt>
                <dd>{formatarPrecCp(detalhe.beneficiario.precCp)}</dd>
              </div>
              <div>
                <dt>Faixa etária</dt>
                <dd>{detalhe.beneficiario.faixaEtaria}</dd>
              </div>
              <div>
                <dt>OCS</dt>
                <dd>{detalhe.ocsNome}</dd>
              </div>
            </dl>
          </section>

          {origemMedico && (
            <section className="pgs__cartao" aria-labelledby="pgs-exames">
              <h2 id="pgs-exames">Exames solicitados</h2>
              <ul className="pgs__exames">
                {detalhe.procedimentos.map((p) => (
                  <li key={p.codigoTuss}>{formatarExame(p)}</li>
                ))}
              </ul>
              {detalhe.medicoCriador && (
                <p className="pgs__pequeno">{textoCriadaPor(detalhe.medicoCriador)}</p>
              )}
            </section>
          )}
        </div>

        <section className="pgs__cartao" aria-labelledby="pgs-encaminhamento">
          <h2 id="pgs-encaminhamento">Encaminhamento anexado</h2>
          {detalhe.encaminhamento ? (
            <ViewerEncaminhamento
              url={urlEncaminhamento}
              tipo={detalhe.encaminhamento.tipo}
              nome={detalhe.encaminhamento.nome}
              erro={erroEncaminhamento}
            />
          ) : (
            <div className="pgs__vazio">
              {origemMedico ? 'Não há anexo: pré-guia criada pelo médico' : 'Encaminhamento não encontrado.'}
            </div>
          )}
        </section>
      </div>

      <section className="pgs__cartao" aria-labelledby="pgs-decisao">
        <h2 id="pgs-decisao">Decisão do setor</h2>

        {situacao === 'guia-enviada' && <p className="pgs__aviso">Guia já enviada para assinatura</p>}
        {situacao === 'aguardando-correcao' && (
          <p className="pgs__aviso">Aguardando correção.</p>
        )}

        {(situacao === 'ativa' || situacao === 'indisponivel') && (
          <div className="pgs__duas-colunas">
            <fieldset className="pgs__fieldset" disabled={!ativa}>
              <ColunaCorrecao enviando={acao === 'correcao'} onConfirmar={requererCorrecao} />
            </fieldset>
            <fieldset className="pgs__fieldset" disabled={!ativa}>
              <ColunaGerarGuia
                numero={numeroGuia}
                rascunho={detalhe.guiaRascunho}
                podeConcluir={podeConcluirGuia(detalhe, numeroGuia)}
                enviandoAnexo={acao === 'anexo'}
                enviandoConclusao={acao === 'conclusao'}
                onNumeroChange={setNumeroDigitado}
                onAnexar={anexarGuia}
                onConcluir={concluirGuia}
              />
            </fieldset>
          </div>
        )}
      </section>
    </section>
  );
}
