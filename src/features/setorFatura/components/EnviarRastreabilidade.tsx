import { useState } from 'react'
import { ApiError } from '../../../shared/api/http'

const RESPONSAVEL_MINIMO = 3
const RESPONSAVEL_MAXIMO = 100

interface Props {
  onEnviar: (responsavel: string) => Promise<void>
}

/**
 * Ação "Enviar para a rastreabilidade" (T24-FE3): aparece em fatura Protocolada. Pede o nome do responsável
 * (3 a 100 caracteres, sem espaços nas pontas), igual ao protocolo. Erro do servidor fica no formulário.
 */
export default function EnviarRastreabilidade({ onEnviar }: Props) {
  const [aberto, setAberto] = useState(false)
  const [responsavel, setResponsavel] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const normalizado = responsavel.trim()
  const podeEnviar = normalizado.length >= RESPONSAVEL_MINIMO && normalizado.length <= RESPONSAVEL_MAXIMO && !enviando

  async function enviar(evento: React.FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!podeEnviar) return
    setEnviando(true)
    setErro(null)
    try {
      await onEnviar(normalizado)
    } catch (e) {
      setErro(e instanceof ApiError ? e.message : 'Não foi possível enviar para a rastreabilidade.')
      setEnviando(false)
    }
  }

  if (!aberto) {
    return (
      <button type="button" className="sf-botao" onClick={() => setAberto(true)}>
        Enviar para a rastreabilidade
      </button>
    )
  }

  return (
    <form className="sf-protocolo" aria-label="Enviar para a rastreabilidade" onSubmit={enviar}>
      <label>
        Responsável pelo envio
        <input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} maxLength={RESPONSAVEL_MAXIMO} />
      </label>

      {erro && (
        <p className="sf-erro" role="alert">
          {erro}
        </p>
      )}

      <div className="sf-acoes">
        <button type="submit" className="sf-botao" disabled={!podeEnviar}>
          {enviando ? 'Enviando…' : 'Confirmar envio'}
        </button>
        <button type="button" className="sf-botao sf-botao--secundario" onClick={() => setAberto(false)} disabled={enviando}>
          Cancelar
        </button>
      </div>
    </form>
  )
}
