interface Props {
  arquivo: File | null
}

const EXTENSOES_PERMITIDAS = ['pdf', 'jpg', 'jpeg', 'png']
const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024 // 10 MB

type Resultado =
  | { tipo: 'ok'; mensagem: string }
  | { tipo: 'erro'; mensagem: string }

function extensaoDe(nome: string): string {
  const ponto = nome.lastIndexOf('.')
  if (ponto < 0) return ''
  return nome.slice(ponto + 1).toLowerCase()
}

function validar(arquivo: File): Resultado {
  const extensao = extensaoDe(arquivo.name)
  if (!EXTENSOES_PERMITIDAS.includes(extensao)) {
    return { tipo: 'erro', mensagem: 'Formato inválido. Envie PDF, JPG ou PNG.' }
  }
  if (arquivo.size > TAMANHO_MAXIMO_BYTES) {
    return { tipo: 'erro', mensagem: 'Arquivo maior que o limite de 10 MB.' }
  }
  return { tipo: 'ok', mensagem: 'Arquivo pronto para envio.' }
}

/**
 * SCRUM 24 — feedback visual do arquivo escolhido.
 */
export default function FeedbackUpload({ arquivo }: Props) {
  if (!arquivo) return null

  const resultado = validar(arquivo)
  const ok = resultado.tipo === 'ok'

  return (
    <div className={ok ? 'ok' : 'erro'} role={ok ? 'status' : 'alert'}>
      <p>{resultado.mensagem}</p>
    </div>
  )
}
