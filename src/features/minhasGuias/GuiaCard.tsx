import { useState } from 'react'
import { formatarData } from '../../shared/utils/formatadores'
import SituacaoGuiaBadge from './SituacaoGuiaBadge'
import type { GuiaDoBeneficiario, MinhasGuiasApi } from './types'

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

export default function GuiaCard({ guia, api, onAtualizar }: Props) {
  const c = contarSessoes(guia)
  const sessoesAutorizadas = guia.procedimentos.reduce(
  (total, p) => total + p.quantidade,
  0,
)

  // Estado local do envio à OCS (T18-FE-2)
  const [confirmando, setConfirmando] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)
  const [mensagemSucesso, setMensagemSucesso] = useState<string | null>(null)

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

  return (
    <article className="mg-card" aria-label={`Guia nº ${guia.numero}`}>
      <header className="mg-card__topo">
        <h2>
          Guia nº {guia.numero} · {guia.ocs}
        </h2>
        <SituacaoGuiaBadge situacao={guia.situacao} />
      </header>

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

      <p className="mg-card__texto">{textoPrincipal(guia, c)}</p>

      {guia.situacao === 'ENCERRADA' && (
        <p className="mg-card__contadores">
          Sessões assinadas: {c.assinadas}. Sessões expiradas (não cobráveis): {c.expiradas}.
        </p>
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

      {/* mensagem de sucesso, depois do envio */}
      {mensagemSucesso && (
        <p className="mg-sucesso" role="status">
          {mensagemSucesso}
        </p>
      )}
    </article>
  )
}