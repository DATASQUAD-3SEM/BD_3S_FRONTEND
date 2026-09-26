interface Props {
  /** Arquivo vindo do container (form.arquivo). Pode ser null quando nada foi anexado. */
  arquivo: File | null
}

/** Tipos aceitos pelo backend (ver docs/CONTRATO_API.md, POST /pre-guias). */
const TIPOS_ACEITOS = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png']

/** Limite de 10 MB, igual ao contrato do backend. */
const TAMANHO_MAXIMO_BYTES = 10 * 1024 * 1024

/**
 * SCRUM 24 - feedback visual de sucesso/erro do arquivo escolhido.
 * É um componente "burro": só olha o arquivo recebido e mostra a mensagem certa.
 * Não faz upload, não abre câmera, não desabilita botão — isso é de outras tasks.
 */
export default function FeedbackUpload({ arquivo }: Props) {
  if (!arquivo) {
    return (
      <div className="em-construcao" role="note">
        <strong>Nenhum arquivo anexado.</strong>
        <span>Anexe o encaminhamento médico (PDF, JPG ou PNG, até 10 MB).</span>
      </div>
    )
  }

  const tipoInvalido = !TIPOS_ACEITOS.includes(arquivo.type)
  const grandeDemais = arquivo.size > TAMANHO_MAXIMO_BYTES

  if (tipoInvalido) {
    return (
      <div className="erro" role="alert">
        <p><strong>Formato inválido.</strong></p>
        <p>O encaminhamento deve ser PDF, JPG ou PNG.</p>
      </div>
    )
  }

  if (grandeDemais) {
    return (
      <div className="erro" role="alert">
        <p><strong>Arquivo muito grande.</strong></p>
        <p>O tamanho máximo permitido é 10 MB.</p>
      </div>
    )
  }

  return (
    <div className="ok" role="status">
      <p><strong>Arquivo pronto para envio.</strong></p>
      <p>{arquivo.name}</p>
    </div>
  )
}
