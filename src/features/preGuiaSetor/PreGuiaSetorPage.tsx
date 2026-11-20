import { useEffect, useRef, useState } from 'react';
import StatusBadge from '../../shared/components/StatusBadge';
import { preGuiaSetorApi } from './api';
import ColunaCorrecao from './components/ColunaCorrecao';
import ColunaGerarGuia from './components/ColunaGerarGuia';
import ViewerEncaminhamento from './components/ViewerEncaminhamento';
import {
  brParaIso,
  conferirGuia,
  errosDeConferenciaDoServidor,
  isoParaBr,
  mensagemDoCampoUg,
  temErroDeConferencia,
  UG_FUSEX,
  type ErrosServidorConferencia,
} from './conferenciaGuia';
import { formatarExame, textoCriadaPor } from './formatadores';
import { formatarPrecCp, formatarCpf } from '../../shared/utils/formatadores'; // T17-FE
import {
  erroDeExames,
  examesIguaisAoSalvo,
  examesValidos,
  linhasDeExames,
  paraExamesGuia,
  type LinhaExame,
} from './examesGuia';
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
type Acao = 'correcao' | 'conclusao';

/**
 * PDF escolhido nesta sessao (ainda nao enviado) e o que esta nos campos de numero, UG e validade (T16-FE).
 * `null` = so o rascunho salvo.
 */
interface AnexoSessao {
  arquivo: File | null;
  numero: string;
  /** Valor do campo "UG da Guia". */
  ug: string;
  /** UG Origem lida do PDF: sem campo e nao editavel, nao muda quando a UG do campo e corrigida. */
  ugOrigem: string | null;
  /** Valor do campo de validade, em dd/mm/aaaa. */
  validade: string;
  /** Usuario removeu o anexo nesta sessao: esconde tambem o rascunho salvo. */
  removido: boolean;
  /** Prec CP do paciente lido do PDF (T21-BE1); null quando nao foi lido. Ausente quando a leitura falhou (429/500). */
  precCpLido?: string | null;
  /** Resultado da conferencia do Prec CP (T21-BE1): true/false, ou null quando nao foi lido. Ausente quando a leitura falhou. */
  precCpConfere?: boolean | null;
}

/** Tela "Pré-guia {número}" do Setor de Guias (T4-FE). */
export default function PreGuiaSetorPage({ id, api = preGuiaSetorApi, onVoltarFila }: Props) {
  const [detalhe, setDetalhe] = useState<DetalhePreGuia | null>(null);
  const [carga, setCarga] = useState<Carga>('carregando');
  const [versao, setVersao] = useState(0);
  const [acao, setAcao] = useState<Acao | null>(null);
  const [erroAcao, setErroAcao] = useState<string | null>(null);
  const [anexo, setAnexo] = useState<AnexoSessao | null>(null);
  const [urlEncaminhamento, setUrlEncaminhamento] = useState<string | null>(null);
  const [erroEncaminhamento, setErroEncaminhamento] = useState(false);
  // Tabela de exames (T22-FE1): so e preenchida na primeira carga, para nao perder edicoes em recargas.
  const [linhas, setLinhas] = useState<LinhaExame[]>([]);
  const [erroExames, setErroExames] = useState<string | null>(null);
  // T16-BE2: o servidor recusou UG, UG Origem ou validade (422); a mensagem aparece abaixo do campo.
  const [errosServidor, setErrosServidor] = useState<ErrosServidorConferencia | null>(null);
  const examesIniciados = useRef(false);

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
        if (!examesIniciados.current) {
          examesIniciados.current = true;
          setLinhas(linhasDeExames(dados.guiaRascunho?.exames));
        }
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

  const rascunho = detalhe.guiaRascunho;
  const numeroGuia = anexo ? anexo.numero : (rascunho?.numero ?? '');
  const arquivoNovo = anexo?.arquivo ?? null;
  // Editar o número não esconde o anexo salvo; só "Remover" esconde.
  const nomeArquivo = anexo?.removido ? null : (arquivoNovo?.name ?? rascunho?.nomeArquivo ?? null);
  // Com o anexo escondido, o rascunho não pode ser concluído.
  const rascunhoVisivel = nomeArquivo ? rascunho : null;

  // T16-FE: UG e validade. Com um rascunho salvo, a UG vem preenchida com a do FUSEX (a unica aceita: o rascunho so
  // existe se passou na conferencia) e a validade e a gravada. A UG Origem so existe depois de ler um PDF.
  const ugGuia = anexo ? anexo.ug : rascunho ? UG_FUSEX : '';
  const validadeGuia = anexo ? anexo.validade : isoParaBr(rascunho?.validadeAte);
  const ugOrigemLida = anexo ? anexo.ugOrigem : null;
  // Sem PDF anexado, os campos estao vazios de proposito: nao ha o que conferir.
  const erros = nomeArquivo
    ? conferirGuia({ ug: ugGuia, ugOrigemLida, validade: validadeGuia })
    : { ug: null, ugOrigem: null, validade: null };
  // T21-FE: Prec CP do paciente diferente do da pre-guia tambem bloqueia o Concluir (o aviso de nao lido nao bloqueia).
  const precCpConfere = anexo?.precCpConfere;
  const precCpLido = anexo?.precCpLido ?? null;
  const erroPrecCp = precCpConfere === false;
  const conferenciaPendente = temErroDeConferencia(erros) || erroPrecCp;
  const erroUg = mensagemDoCampoUg(erros) ?? errosServidor?.ug ?? errosServidor?.ugOrigem ?? null;
  const erroValidade = erros.validade ?? errosServidor?.validadeAte ?? null;

  // Edita um campo sem perder o resto do que esta na tela; com so o rascunho salvo, parte dos valores dele.
  const editarAnexo = (mudancas: Partial<AnexoSessao>) => {
    setErrosServidor(null);
    setAnexo({
      arquivo: arquivoNovo,
      numero: numeroGuia,
      ug: ugGuia,
      ugOrigem: ugOrigemLida,
      validade: validadeGuia,
      removido: anexo?.removido ?? false,
      ...mudancas,
    });
  };
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

  // Envia o PDF escolhido (se houver) com o numero do campo e depois conclui a Guia.
  // Com PDF novo, envia o PDF, o numero e os exames (T22-BE1) e depois conclui a Guia (T22-BE2).
  // Um 422 sobre os exames aparece abaixo da tabela e a Guia nao e concluida.
  // T16-FE: o PUT leva tambem ug (campo), ugOrigem (lida do PDF; se nao foi lida, o valor do campo UG) e validadeAte
  // (yyyy-mm-dd). ug e ugOrigem so servem para o servidor conferir. Um 422 sobre UG, UG Origem ou validade aparece
  // abaixo do campo e a Guia nao e concluida.
  const concluirGuia = () => {
    setErroExames(null);
    setErrosServidor(null);
    return executar(
      'conclusao',
      async () => {
        if (arquivoNovo) {
          try {
            await api.anexarGuia(detalhe.id, numeroGuia.trim(), arquivoNovo, paraExamesGuia(linhas), {
              ug: ugGuia.trim(),
              ugOrigem: (ugOrigemLida ?? ugGuia).trim(),
              validadeAte: brParaIso(validadeGuia) ?? '',
            });
          } catch (erro) {
            const errosConferencia = errosDeConferenciaDoServidor(erro);
            if (errosConferencia) {
              setErrosServidor(errosConferencia);
              return;
            }
            if (erroDeExames(erro)) {
              setErroExames(mensagemDeErro(erro, { padrao: 'Confira os exames da Guia.' }));
              return;
            }
            throw erro;
          }
        }
        await api.concluirGuia(detalhe.id);
      },
      {
        padrao: 'Não foi possível concluir a Guia.',
        conflito: 'Não foi possível concluir: confira se a Guia está anexada e se ela ainda não foi enviada.',
      },
    );
  };

  // Exames (T22-FE1): sem PDF novo, o PUT nao pode ser enviado (o backend exige o PDF), entao
  // alterar a tabela de um rascunho salvo so e gravado depois de anexar o PDF de novo.
  const examesOk = examesValidos(linhas);
  const examesMudaramSemArquivo =
    arquivoNovo === null && rascunhoVisivel !== null && !examesIguaisAoSalvo(linhas, rascunhoVisivel.exames);
  // T16-FE: o mesmo vale para a validade (a UG nao e gravada, entao corrigi-la nao exige o PDF de novo).
  const validadeMudouSemArquivo =
    arquivoNovo === null &&
    rascunhoVisivel !== null &&
    brParaIso(validadeGuia) !== (rascunhoVisivel.validadeAte ?? null);
  const avisoConclusao =
    examesMudaramSemArquivo && validadeMudouSemArquivo
      ? 'Para salvar as alterações, anexe o PDF da Guia de novo.'
      : examesMudaramSemArquivo
        ? 'Para salvar as alterações dos exames, anexe o PDF da Guia de novo.'
        : validadeMudouSemArquivo
          ? 'Para salvar a alteração da validade, anexe o PDF da Guia de novo.'
          : null;

  // T17-FE: Tratamento seguro para o CPF
  const cpfLimpo = detalhe.beneficiario.cpf?.replace(/\D/g, '');
  const cpfFormatado = (cpfLimpo && cpfLimpo.length === 11) ? formatarCpf(cpfLimpo) : '—';

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
                <dt>CPF</dt>
                <dd>{cpfFormatado}</dd>
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
                nomeArquivo={nomeArquivo}
                arquivoNovo={arquivoNovo}
                ug={ugGuia}
                validade={validadeGuia}
                erroUg={erroUg}
                erroValidade={erroValidade}
                conferenciaPendente={conferenciaPendente}
                precCpCadastrado={detalhe.beneficiario.precCp}
                precCpLido={precCpLido}
                precCpConfere={precCpConfere}
                linhasExames={linhas}
                onExamesChange={(novas) => {
                  setErroExames(null);
                  setLinhas(novas);
                }}
                erroExames={erroExames}
                avisoConclusao={avisoConclusao}
                podeConcluir={
                  podeConcluirGuia({
                    numero: numeroGuia,
                    arquivoNovo: arquivoNovo !== null,
                    rascunho: rascunhoVisivel,
                  }) &&
                  examesOk &&
                  !conferenciaPendente &&
                  !examesMudaramSemArquivo &&
                  !validadeMudouSemArquivo
                }
                enviandoConclusao={acao === 'conclusao'}
                extrairNumeroGuia={(pdf) => api.extrairNumeroGuia(pdf, id)}
                onNumeroChange={(numero) => editarAnexo({ numero })}
                onUgChange={(ug) => editarAnexo({ ug })}
                onValidadeChange={(validade) => editarAnexo({ validade })}
                onAnexar={(pdf, leitura) => {
                  setAnexo({
                    arquivo: pdf,
                    numero: leitura.numero,
                    ug: leitura.ug,
                    ugOrigem: leitura.ugOrigem,
                    validade: isoParaBr(leitura.validadeAte),
                    removido: false,
                    precCpLido: leitura.precCpLido,
                    precCpConfere: leitura.precCpConfere,
                  });
                  setLinhas(linhasDeExames(leitura.exames));
                  setErroExames(null);
                  setErrosServidor(null);
                }}
                onRemover={() => {
                  setAnexo({ arquivo: null, numero: '', ug: '', ugOrigem: null, validade: '', removido: true });
                  setLinhas([]);
                  setErrosServidor(null);
                }}
                onConcluir={concluirGuia}
              />
            </fieldset>
          </div>
        )}
      </section>
    </section>
  );
}
