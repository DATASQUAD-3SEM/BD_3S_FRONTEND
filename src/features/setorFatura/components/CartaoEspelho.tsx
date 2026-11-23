import { useState } from 'react'
import { avisoPrazoOcs, formatarDataCurta, formatarMoeda, tituloDoEspelho } from '../formatadores'
import type { EspelhoDetalhe, EspelhoResumo } from '../types'
import ControleFluxoFatura from './ControleFluxoFatura'
import EnviarRastreabilidade from './EnviarRastreabilidade'
import ProtocolarFatura from './ProtocolarFatura'
import SeloSituacao from './SeloSituacao'
import TabelaGuiasEspelho from './TabelaGuiasEspelho'

interface Props {
  espelho: EspelhoResumo
  aberto: boolean
  detalhe: EspelhoDetalhe | null
  carregando: boolean
  erro: string | null
  onToggle: (id: number) => void
  /** Sugestao do proximo nº (T24-BE3). Sem ela, o formulário abre sem sugestão. */
  sugerirNumero?: (id: number) => Promise<string>
  /** Protocola o espelho (T24-FE2). Sem ela, o botão "Inserir nº da fatura" não aparece. */
  onProtocolar?: (id: number, numeroFatura: string, responsavel: string) => Promise<void>
  /** Envia a fatura Protocolada para a rastreabilidade (T24-FE3). Sem ela, a ação não aparece. */
  onEnviarLisura?: (id: number, responsavel: string) => Promise<void>
}

/** Cartão de um espelho/fatura recebido. Clicar no cabeçalho abre e fecha o detalhe, dentro do próprio cartão. */
export default function CartaoEspelho({
  espelho,
  aberto,
  detalhe,
  carregando,
  erro,
  onToggle,
  sugerirNumero,
  onProtocolar,
  onEnviarLisura,
}: Props) {
  const [formularioAberto, setFormularioAberto] = useState(false)
  const [numeroSugerido, setNumeroSugerido] = useState<string | null>(null)
  const [buscandoSugestao, setBuscandoSugestao] = useState(false)

  const podeProtocolar = espelho.situacao === 'RECEBIDO' && !!onProtocolar && !!detalhe

  /* O formulário só monta depois da sugestão: ele lê o nº sugerido uma única vez, na montagem. */
  async function abrirFormulario() {
    setBuscandoSugestao(true)
    let sugestao: string | null = null
    if (sugerirNumero) {
      try {
        sugestao = await sugerirNumero(espelho.id)
      } catch {
        sugestao = null
      }
    }
    setNumeroSugerido(sugestao)
    setBuscandoSugestao(false)
    setFormularioAberto(true)
  }
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

              {podeProtocolar && !formularioAberto && (
                <button type="button" className="sf-botao" onClick={abrirFormulario} disabled={buscandoSugestao}>
                  {buscandoSugestao ? 'Buscando sugestão…' : 'Inserir nº da fatura'}
                </button>
              )}

              {podeProtocolar && formularioAberto && (
                <ProtocolarFatura
                  dataEntrada={detalhe.dataEntrada}
                  ocs={detalhe.ocs}
                  numeroSugerido={numeroSugerido}
                  onSalvar={async (numero, responsavel) => {
                    await onProtocolar!(espelho.id, numero, responsavel)
                    setFormularioAberto(false)
                  }}
                  onCancelar={() => setFormularioAberto(false)}
                />
              )}

              {espelho.situacao === 'PROTOCOLADA' && !!onEnviarLisura && (
                <EnviarRastreabilidade
                  numeroFatura={detalhe.numeroFatura}
                  onEnviar={(responsavel) => onEnviarLisura(espelho.id, responsavel)}
                />
              )}

              <ControleFluxoFatura etapas={detalhe.controleFluxo} />
            </>
          )}
        </div>
      )}
    </article>
  )
}
