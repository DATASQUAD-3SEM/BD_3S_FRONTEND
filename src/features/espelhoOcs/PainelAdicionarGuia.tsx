import { useState } from 'react'
import { espelhoApi } from './api'
import { montarValores, rotuloSituacao, valoresPreenchidos } from './formatadores'
import { mensagemDeErro } from '../../shared/api/erros'
import type { GuiaFinalizada } from './types'

interface Props {
  guia: GuiaFinalizada
  valores: Record<string, string>
  onAlterarValor: (codDgp: string, texto: string) => void
  onCancelar: () => void
  onEnviado: () => void
}

export default function PainelAdicionarGuia({ guia, valores, onAlterarValor, onCancelar, onEnviado }: Props) {
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const completo = valoresPreenchidos(guia.procedimentos, valores)

  async function enviar() {
    setErro(null)
    setEnviando(true)
    try {
      await espelhoApi.adicionarGuia(guia.id, montarValores(guia.procedimentos, valores))
      onEnviado()
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível adicionar a guia ao espelho.'))
      setEnviando(false)
    }
  }

  return (
    <div className="ge-painel">
      <dl className="ge-painel-dados">
        <div>
          <dt>Beneficiário</dt>
          <dd>{guia.beneficiario.nome}</dd>
        </div>
        <div>
          <dt>Situação</dt>
          <dd>{rotuloSituacao(guia.situacao)}</dd>
        </div>
      </dl>

      <ul className="ge-painel-linhas">
        {guia.procedimentos.map((procedimento) => (
          <li key={procedimento.codDgp} className="ge-painel-linha">
            <div>
              <strong>{procedimento.codDgp}</strong> · {procedimento.descricao}
              <span className="ge-sessoes">{`Sessões assinadas: ${procedimento.quantidadeAssinadas}`}</span>
            </div>
            <div className="ge-campo-valor">
              <label htmlFor={`valor-${guia.id}-${procedimento.codDgp}`}>Valor por sessão (R$)</label>
              <input
                id={`valor-${guia.id}-${procedimento.codDgp}`}
                type="text"
                inputMode="decimal"
                aria-label={`Valor por sessão de ${procedimento.codDgp}`}
                value={valores[procedimento.codDgp] ?? ''}
                disabled={enviando}
                onChange={(evento) => onAlterarValor(procedimento.codDgp, evento.target.value)}
              />
            </div>
          </li>
        ))}
      </ul>

      {erro && (
        <p role="alert" className="estado-erro">
          {erro}
        </p>
      )}

      <div className="ge-painel-acoes">
        <button
          type="button"
          className="botao botao-primario"
          disabled={!completo || enviando}
          onClick={() => void enviar()}
        >
          {enviando ? 'Enviando…' : 'Enviar'}
        </button>
        <button type="button" className="botao" disabled={enviando} onClick={onCancelar}>
          Cancelar
        </button>
      </div>
    </div>
  )
}
