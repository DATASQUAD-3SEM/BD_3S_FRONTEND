import { avisoPrazoOcs, formatarDataCurta, formatarMoeda, tituloDoEspelho } from '../formatadores'
import type { EspelhoDetalhe, EspelhoResumo } from '../types'
import ControleFluxoFatura from './ControleFluxoFatura'
import SeloSituacao from './SeloSituacao'
import TabelaGuiasEspelho from './TabelaGuiasEspelho'

interface Props {
  espelho: EspelhoResumo
  aberto: boolean
  detalhe: EspelhoDetalhe | null
  carregando: boolean
  erro: string | null
  onToggle: (id: number) => void
}

/** Cartão de um espelho/fatura recebido. Clicar no cabeçalho abre e fecha o detalhe, dentro do próprio cartão. */
export default function CartaoEspelho({ espelho, aberto, detalhe, carregando, erro, onToggle }: Props) {
  // O detalhe traz também quem deu a ciência; sem ele, o aviso usa os dados da lista.
  const aviso = avisoPrazoOcs(detalhe ?? espelho)

  return (
    <article className={`sf-cartao${aberto ? ' sf-cartao--aberto' : ''}`}>
      <button
        type="button"
        className="sf-cartao-cabecalho"
        aria-expanded={aberto}
        aria-controls={`sf-detalhe-${espelho.id}`}
        onClick={() => onToggle(espelho.id)}
      >
        <span className="sf-cartao-titulo">
          {tituloDoEspelho(espelho)} · {espelho.ocs}
        </span>
        <SeloSituacao situacao={espelho.situacao} />
      </button>

      <p className="sf-cartao-resumo">
        Período: {formatarDataCurta(espelho.dataInicio)} a {formatarDataCurta(espelho.dataEnvio)} · Valor total:{' '}
        {formatarMoeda(espelho.valorTotal)} · Entrada em {formatarDataCurta(espelho.dataEntrada)}
      </p>

      {aviso && <p className="sf-cartao-prazo">{aviso}</p>}

      {aberto && (
        <div id={`sf-detalhe-${espelho.id}`} className="sf-cartao-detalhe">
          {carregando && <p className="sf-pequeno" role="status">Carregando detalhe…</p>}

          {erro && (
            <p className="sf-erro" role="alert">
              {erro}
            </p>
          )}

          {detalhe && (
            <>
              <TabelaGuiasEspelho linhas={detalhe.linhas} />

              {detalhe.numeroFatura && (
                <p className="sf-cartao-protocolo">
                  Nº da fatura: {detalhe.numeroFatura} · Entrada em {formatarDataCurta(detalhe.dataEntrada)} ·
                  OCS/PSA: {detalhe.ocs}
                </p>
              )}

              {/* Ações da situação (T24-FE2 "Inserir nº da fatura" e T24-FE3 "Enviar para a rastreabilidade"):
                  implementadas nas próximas subtasks. */}

              <ControleFluxoFatura etapas={detalhe.controleFluxo} />
            </>
          )}
        </div>
      )}
    </article>
  )
}
