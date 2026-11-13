import { formatarData } from '../../shared/utils/formatadores'
import SituacaoGuiaBadge from './SituacaoGuiaBadge'
import type { GuiaDoBeneficiario } from './types'

interface Props {
  guia: GuiaDoBeneficiario
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

function contarSessoes(guia: GuiaDoBeneficiario): Contadores {
  return {
    total: guia.sessoes.length,
    assinadas: guia.sessoes.filter((s) => s.status === 'ASSINADA').length,
    solicitadas: guia.sessoes.filter((s) => s.status === 'SOLICITADA').length,
    expiradas: guia.sessoes.filter((s) => s.status === 'EXPIRADA').length,
  }
}

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

export default function GuiaCard({ guia }: Props) {
  const c = contarSessoes(guia)

  return (
    <article className="mg-card" aria-label={`Guia nº ${guia.numero}`}>
      <header className="mg-card__topo">
        <h2>
          Guia nº {guia.numero} · {guia.ocs.nome}
        </h2>
        <SituacaoGuiaBadge situacao={guia.situacao} />
      </header>

      <p className="mg-card__meta">
        Válida até {formatarData(guia.validadeAte)}
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
    </article>
  )
}