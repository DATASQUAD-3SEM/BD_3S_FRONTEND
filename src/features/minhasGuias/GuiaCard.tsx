import { useCallback, useState } from 'react'
import { formatarData } from '../../shared/utils/formatadores'
import { ApiError } from '../../shared/api/http'
import { obterBeneficiarioLogado } from '../beneficiario/dadosBeneficiario'
import VisualizadorPdf from '../espelhoOcs/VisualizadorPdf'
import { textoPaciente } from '../minhasPreGuias/paciente'
import SituacaoGuiaBadge from './SituacaoGuiaBadge'
import type { GuiaDoBeneficiario, MinhasGuiasApi, SessaoDaGuia } from './types'

interface Props {
  guia: GuiaDoBeneficiario
  api: MinhasGuiasApi
  onAtualizar: (guiaAtualizada: GuiaDoBeneficiario) => void
}

function textoQuantidade(quantidade: number): string {
  return quantidade === 1 ? '1 sessão autorizada' : `${quantidade} sessões autorizadas`
}

interface Contadores {
  total: number
  assinadas: number
  solicitadas: number
  expiradas: number
}

//Conta as sessões da guia por situação; base do texto e dos contadores do cartão
function contarSessoes(guia: GuiaDoBeneficiario): Contadores {
  return {
    total: guia.sessoes.length,
    assinadas: guia.sessoes.filter((s) => s.status === 'ASSINADA').length,
    solicitadas: guia.sessoes.filter((s) => s.status === 'SOLICITADA').length,
    expiradas: guia.sessoes.filter((s) => s.status === 'EXPIRADA').length,
  }
}

//Texto principal do cartão, conforme a situação da guia (T18-FE-1)
function textoPrincipal(guia: GuiaDoBeneficiario, c: Contadores): string {
  switch (guia.situacao) {
    case 'NAO_ENVIADA':
      return 'Guia pronta. Envie para a OCS para que ela possa solicitar as sessões.'
    case 'ENVIADA':
      return 'Enviada à OCS. Aguardando a OCS solicitar a assinatura de uma sessão.'
    case 'EM_EXECUCAO':
      return `Assinadas: ${c.assinadas} de ${c.total}. Solicitadas para assinar: ${c.solicitadas}.`
    case 'REALIZADA':
      return 'Todas as sessões foram assinadas. Não há mais nada a fazer nesta guia.'
    case 'ENCERRADA':
      return 'A sua Guia expirou antes de você realizar todas as assinaturas. Será necessário o requerimento de uma nova Guia.'
    case 'VENCIDA':
      return 'A sua Guia expirou e você não realizou nenhuma assinatura. Será necessário o requerimento de uma nova Guia.'
    default:
      return ''
  }
}

//Mensagem de erro padrão para o 422 "sem assinatura cadastrada" (mesma do backend)
const MSG_SEM_ASSINATURA =
  'Você ainda não tem assinatura cadastrada. Cadastre em Minhas informações para assinar.'

//Sessões ASSINADAS ordenadas por número, para a linha "Já assinadas: sessão N em ..."
/** Guia de dependente cujo acesso ao FUSEX ja foi encerrado (vigencia vencida), T30-FE2. */
function dependenteEncerrado(guia: GuiaDoBeneficiario): boolean {
  const p = guia.paciente
  if (!p || p.dependenteId === null || !p.vigenciaFim) return false
  return p.vigenciaFim < new Date().toISOString().slice(0, 10)
}

function sessoesAssinadas(guia: GuiaDoBeneficiario): SessaoDaGuia[] {
  return guia.sessoes
    .filter((s) => s.status === 'ASSINADA')
    .sort((a, b) => a.numero - b.numero)
}

export default function GuiaCard({ guia, api, onAtualizar }: Props) {
  const c = contarSessoes(guia)
  const sessoesAutorizadas = guia.procedimentos.reduce(
    (total, p) => total + p.quantidade,
    0,
  )
  const [assinaturaCadastrada, setAssinaturaCadastrada] = useState<boolean | null>(null)

  // Estado local do envio à OCS (T18-FE-2)
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)

  // Estado local da assinatura de sessão (T18-FE-3)
  const [painelSessoesAberto, setPainelSessoesAberto] = useState(false)
  const [sessaoEmConfirmacao, setSessaoEmConfirmacao] = useState<number | null>(null)
  const [assinando, setAssinando] = useState(false)
  const [erroAssinatura, setErroAssinatura] = useState<string | null>(null)

  // Ver guia (PDF), T23-FE1: o painel busca o PDF a cada abertura (desmonta ao fechar)
  const [pdfAberto, setPdfAberto] = useState(false)
  const obterPdf = useCallback(() => api.obterPdf(guia.id), [api, guia.id])

  // Abre a confirmação, limpando resultado anterior
  function abrirConfirmacao() {
    setErroEnvio(null)
    setMensagemSucesso(null)
    setConfirmando(true)
  }

  // Fecha a confirmação sem enviar; limpa erro anterior
  function cancelar() {
    setConfirmando(false)
    setErroEnvio(null)
  }

  // confirma o envio: chama POST /guias/{id}/envio.
  // Em sucesso, atualiza o cartão (situação ENVIADA) e troca o painel por mensagem.
  // Em erro, mantém o painel aberto com a mensagem padrão; a guia continua Não enviada.
  async function confirmarEnvio() {
    if (enviando) return
    setEnviando(true)
    setErroEnvio(null)
    try {
      const atualizada = await api.enviar(guia.id)
      onAtualizar(atualizada)
      setConfirmando(false)
      setMensagemSucesso(`Guia nº ${guia.numero} enviada à OCS`)
    } catch {
      setErroEnvio('Não foi possível enviar a guia. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  // Abre o painel de sessões, limpando resultado anterior
  function abrirPainelSessoes() {
    setErroAssinatura(null)
    setSessaoEmConfirmacao(null)
    setMensagemSucesso(null)
    setPainelSessoesAberto(true)
  }

  // Fecha o painel de sessões, limpando estado
  function fecharPainelSessoes() {
    setPainelSessoesAberto(false)
    setSessaoEmConfirmacao(null)
    setErroAssinatura(null)
  }

  // Abre a confirmação de uma sessão (uma por vez)
  async function abrirConfirmacaoAssinatura(sessaoId: number) {
    setErroAssinatura(null)
    setMensagemSucesso(null)

    // Client-side check: busca a assinatura cadastrada na 1ª abertura (cacheia no state).
    // Se falhar a chamada, segue pro server-side (o backend devolve 422 se não tiver).
    if (assinaturaCadastrada === null) {
      try {
        const b = await obterBeneficiarioLogado()
        setAssinaturaCadastrada(b.assinaturaCadastrada === true)
      } catch {
        setAssinaturaCadastrada(true) // otimista: deixa tentar; o back responde 422 se não tiver
      }
    }

    setSessaoEmConfirmacao(sessaoId)
  }

  function cancelarAssinatura() {
    setSessaoEmConfirmacao(null)
    setErroAssinatura(null)
  }

  // confirma a assinatura: chama POST /guias/{id}/sessoes/{sessaoId}/assinatura.
  // Em sucesso, atualiza o cartão via onAtualizar, mostra a mensagem de quantas faltam
  // e fecha o painel se não houver mais sessões SOLICITADA.
  // 422 = sem assinatura cadastrada (fallback server-side); 409 = sessão já não está SOLICITADA.
  async function confirmarAssinatura(sessaoId: number) {
    if (assinando) return
    setAssinando(true)
    setErroAssinatura(null)

    try {
      const atualizada = await api.assinar(guia.id, sessaoId)
      onAtualizar(atualizada)

      const cAtualizado = contarSessoes(atualizada)
      setSessaoEmConfirmacao(null)

      if (cAtualizado.solicitadas === 0) {
        // Não há mais nada para assinar nesta guia: fecha o painel
        setPainelSessoesAberto(false)
        setMensagemSucesso('Todas as sessões solicitadas foram assinadas.')
      } else {
        const faltam = cAtualizado.solicitadas
        setMensagemSucesso(
          `Sessão assinada. ${faltam === 1 ? 'Falta 1 sessão' : `Faltam ${faltam} sessões`}.`,
        )
      }
    } catch (erro: unknown) {
      if (erro instanceof ApiError && erro.status === 422) {
        setErroAssinatura(MSG_SEM_ASSINATURA)
      } else if (erro instanceof ApiError && erro.status === 409) {
        setErroAssinatura(
          'Não foi possível assinar esta sessão. Ela pode ter sido assinada em outra aba.',
        )
      } else {
        setErroAssinatura('Não foi possível assinar a sessão. Tente novamente.')
      }
    } finally {
      setAssinando(false)
    }
  }

  const solicitadas = guia.sessoes.filter((s) => s.status === 'SOLICITADA')
  const assinadas = sessoesAssinadas(guia)
  const semAssinaturaCadastrada = assinaturaCadastrada === false

  return (
    <article className="mg-card" aria-label={`Guia nº ${guia.numero}`}>
      <header className="mg-card__topo">
        <h2>
          Guia nº {guia.numero} · {guia.ocs}
        </h2>
        <SituacaoGuiaBadge situacao={guia.situacao} />
      </header>

      {guia.paciente && <p className="mg-card__meta">Paciente: {textoPaciente(guia.paciente)}</p>}

      <p className="mg-card__meta">
        Válida até {formatarData(guia.validadeAte) || '—'}
        {guia.dataEnvio && <> · Enviada à OCS em {formatarData(guia.dataEnvio)}</>}
      </p>

      {guia.procedimentos.length > 0 && (
        <ul className="mg-card__procedimentos">
          {guia.procedimentos.map((p) => (
            <li key={p.codDgp}>
              {p.codDgp} · {p.descricao} · {textoQuantidade(p.quantidade)}
            </li>
          ))}
        </ul>
      )}

      {dependenteEncerrado(guia) ? (
        <p className="mg-card__texto">
          O acesso de {guia.paciente?.nome} ao FUSEX foi encerrado em {formatarData(guia.paciente?.vigenciaFim ?? null)}. As sessões que faltavam não podem mais ser assinadas.
        </p>
      ) : (
        <p className="mg-card__texto">{textoPrincipal(guia, c)}</p>
      )}

      {(guia.situacao === 'ENCERRADA' || (dependenteEncerrado(guia) && c.assinadas > 0)) && (
        <p className="mg-card__contadores">
          Sessões assinadas: {c.assinadas}. Sessões expiradas (não cobráveis): {c.expiradas}.
        </p>
      )}

      {/* botão Ver guia (PDF), em todo cartão (T23-FE1) */}
      <button
        type="button"
        className="mg-botao"
        aria-expanded={pdfAberto}
        onClick={() => setPdfAberto((aberto) => !aberto)}
      >
        Ver guia (PDF)
      </button>

      {pdfAberto && (
        <VisualizadorPdf
          guiaId={guia.id}
          numero={guia.numero}
          obterPdf={obterPdf}
          onFechar={() => setPdfAberto(false)}
        />
      )}

      {/* botão Enviar para a OCS, só em Não enviada */}
      {guia.situacao === 'NAO_ENVIADA' && !confirmando && !mensagemSucesso && (
        <button
          type="button"
          className="mg-card__acao-primaria"
          onClick={abrirConfirmacao}
        >
          Enviar para a OCS
        </button>
      )}

      {/* painel de confirmação, dentro do cartão */}
      {confirmando && (
        <div className="mg-confirmacao" role="region" aria-label="Confirmação de envio">
          <p className="mg-confirmacao__titulo">
            <strong>Enviar a guia nº {guia.numero} para a OCS?</strong>
          </p>
          <dl className="mg-confirmacao__dados">
            <div>
              <dt>Procedimento</dt>
              <dd>
                {guia.procedimentos
                  .map((p) => `${p.descricao} (${p.quantidade})`)
                  .join(' · ') || '—'}
              </dd>
            </div>
            <div>
              <dt>Sessões autorizadas</dt>
              <dd>{sessoesAutorizadas}</dd>
            </div>
            <div>
              <dt>OCS</dt>
              <dd>{guia.ocs}</dd>
            </div>
          </dl>

          {erroEnvio && (
            <p className="mg-confirmacao__erro" role="alert">
              {erroEnvio}
            </p>
          )}

          <div className="mg-confirmacao__acoes">
            <button
              type="button"
              className="mg-botao mg-botao--primario"
              onClick={() => void confirmarEnvio()}
              disabled={enviando}
            >
              {enviando ? 'Enviando...' : 'Confirmar envio'}
            </button>
            <button
              type="button"
              className="mg-botao"
              onClick={cancelar}
              disabled={enviando}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* mensagem de sucesso do envio */}
      {mensagemSucesso && !painelSessoesAberto && (
        <p className="mg-sucesso" role="status">
          {mensagemSucesso}
        </p>
      )}

      {/* botão "Assinar sessões (Z)": só em Em execução com Z > 0 (T18-FE-3) */}
      {guia.situacao === 'EM_EXECUCAO' && c.solicitadas > 0 && !painelSessoesAberto && (
        <button
          type="button"
          className="mg-card__acao-primaria"
          onClick={abrirPainelSessoes}
        >
          Assinar sessões ({c.solicitadas})
        </button>
      )}

      {/* painel de sessões SOLICITADAS, dentro do cartão (T18-FE-3) */}
      {painelSessoesAberto && (
        <div className="mg-assinar" role="region" aria-label="Sessões para assinar">
          <header className="mg-assinar__topo">
            <p className="mg-assinar__titulo">
              <strong>Sessões solicitadas para assinatura</strong>
            </p>
            <button
              type="button"
              className="mg-botao"
              onClick={fecharPainelSessoes}
              disabled={assinando}
            >
              Fechar
            </button>
          </header>

          {guia.paciente?.voceResponsavel && guia.paciente.dependenteId !== null && (
            <p className="mg-assinar__vazio">
              Você assina pelo paciente {guia.paciente.nome}, como responsável legal, com a sua assinatura cadastrada. Assine uma sessão por vez.
            </p>
          )}

          {solicitadas.length === 0 ? (
            <p className="mg-assinar__vazio">Nenhuma sessão aguardando assinatura.</p>
          ) : (
            <ul className="mg-assinar__lista">
              {solicitadas.map((sessao) => {
                const emConfirmacao = sessaoEmConfirmacao === sessao.id
                const outraEmConfirmacao =
                  sessaoEmConfirmacao !== null && sessaoEmConfirmacao !== sessao.id

                return (
                  <li key={sessao.id} className="mg-assinar__sessao">
                    <div className="mg-assinar__sessao-cabecalho">
                      <span>
                        Sessão {sessao.numero} · {sessao.procedimento}
                        {sessao.dataSolicitacao && (
                          <> · solicitada em {formatarData(sessao.dataSolicitacao)}</>
                        )}
                      </span>
                      {!emConfirmacao && (
                        <button
                          type="button"
                          className="mg-botao"
                          onClick={() => abrirConfirmacaoAssinatura(sessao.id)}
                          disabled={outraEmConfirmacao || assinando}
                        >
                          Assinar
                        </button>
                      )}
                    </div>

                    {emConfirmacao && (
                      <div
                        className="mg-assinar__confirmacao"
                        role="region"
                        aria-label={`Confirmação da sessão ${sessao.numero}`}
                      >
                        <p className="mg-assinar__confirmacao-titulo">
                          <strong>
                            {guia.paciente?.voceResponsavel && guia.paciente.dependenteId !== null
                              ? `Assinar esta sessão de ${guia.paciente.nome} com a sua assinatura cadastrada, como responsável legal?`
                              : `Assinar a sessão ${sessao.numero} · ${sessao.procedimento}?`}
                          </strong>
                        </p>

                        {semAssinaturaCadastrada ? (
                          <p className="mg-assinar__erro" role="alert">
                            {MSG_SEM_ASSINATURA}
                          </p>
                        ) : (
                          erroAssinatura && (
                            <p className="mg-assinar__erro" role="alert">
                              {erroAssinatura}
                            </p>
                          )
                        )}

                        <div className="mg-assinar__acoes">
                          <button
                            type="button"
                            className="mg-botao mg-botao--primario"
                            onClick={() => void confirmarAssinatura(sessao.id)}
                            disabled={
                              assinando || semAssinaturaCadastrada
                            }
                          >
                            {assinando ? 'Assinando...' : 'Confirmar assinatura'}
                          </button>
                          <button
                            type="button"
                            className="mg-botao"
                            onClick={cancelarAssinatura}
                            disabled={assinando}
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    )}
                  </li>
                )
              })}
            </ul>
          )}

          {assinadas.length > 0 && (
            <ul className="mg-assinar__ja-assinadas">
              {assinadas.map((sessao) => (
                <li key={sessao.id}>
                  Já assinadas: sessão {sessao.numero} em {formatarData(sessao.dataAssinatura)}
                </li>
              ))}
            </ul>
          )}

          {mensagemSucesso && (
            <p className="mg-sucesso" role="status">
              {mensagemSucesso}
            </p>
          )}
        </div>
      )}
    </article>
  )
}
