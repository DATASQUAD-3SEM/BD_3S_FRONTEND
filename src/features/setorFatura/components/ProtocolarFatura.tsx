import { useState } from 'react'
import { ApiError } from '../../../shared/api/http'
import { formatarDataCurta } from '../formatadores'

export const FORMATO_NUMERO_FATURA = /^\d{3}\/\d{4}$/
const RESPONSAVEL_MINIMO = 3
const RESPONSAVEL_MAXIMO = 100

interface Props {
  dataEntrada: string
  ocs: string
  /** Sugestao do proximo nº vinda do servidor; null enquanto carrega ou se falhou. */
  numeroSugerido: string | null
  onSalvar: (numeroFatura: string, responsavel: string) => Promise<void>
  onCancelar: () => void
}

/**
 * Formulário "Protocolar fatura" (T24-FE2): transforma o espelho em fatura. Data de entrada e OCS são só leitura;
 * o nº vem sugerido e pode ser alterado. "Salvar protocolo" fica desabilitado até nº válido e responsável com 3 a
 * 100 caracteres. Erros do servidor aparecem abaixo dos campos e o formulário continua aberto.
 */
export default function ProtocolarFatura({ dataEntrada, ocs, numeroSugerido, onSalvar, onCancelar }: Props) {
  const [numero, setNumero] = useState(numeroSugerido ?? '')
  const [responsavel, setResponsavel] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const responsavelNormalizado = responsavel.trim()
  const numeroValido = FORMATO_NUMERO_FATURA.test(numero)
  const responsavelValido =
    responsavelNormalizado.length >= RESPONSAVEL_MINIMO && responsavelNormalizado.length <= RESPONSAVEL_MAXIMO
  const podeSalvar = numeroValido && responsavelValido && !enviando

  async function salvar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!podeSalvar) return
    setEnviando(true)
    setErro(null)
    try {
      await onSalvar(numero, responsavelNormalizado)
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível protocolar a fatura.')
      setEnviando(false)
    }
  }

  return (
    <form className="sf-protocolo" aria-label="Protocolar fatura" onSubmit={salvar}>
      <h3>Protocolar fatura</h3>

      <div className="sf-protocolo-campos">
        <label>
          Data de Entrada
          <input value={formatarDataCurta(dataEntrada)} readOnly />
        </label>
        <label>
          OCS/PSA
          <input value={ocs} readOnly />
        </label>
        <label>
          Nº da Fatura
          <input
            value={numero}
            onChange={(e) => setNumero(e.target.value)}
            placeholder="000/0000"
            aria-invalid={numero.length > 0 && !numeroValido}
          />
        </label>
      </div>

      <p className="sf-pequeno">
        O nº vem sugerido (o próximo desta OCS no ano) e pode ser alterado. A data de entrada é a data em que a OCS
        enviou o espelho.
      </p>

      <label>
        Responsável (seu nome)
        <input
          value={responsavel}
          onChange={(e) => setResponsavel(e.target.value)}
          maxLength={RESPONSAVEL_MAXIMO}
        />
      </label>

      {erro && (
        <p className="sf-erro" role="alert">
          {erro}
        </p>
      )}

      <div className="sf-acoes">
        <button type="submit" className="sf-botao" disabled={!podeSalvar}>
          {enviando ? 'Salvando…' : 'Salvar protocolo'}
        </button>
        <button type="button" className="sf-botao sf-botao--secundario" onClick={onCancelar} disabled={enviando}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
