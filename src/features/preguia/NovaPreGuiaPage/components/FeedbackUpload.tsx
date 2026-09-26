interface Props {
  arquivo: File | null
}

const TIPOS_PERMITIDOS = [
  'application/pdf',
  'image/jpeg',
  'image/png',
]

const TAMANHO_MAXIMO = 10 * 1024 * 1024

export default function FeedbackUpload({ arquivo }: Props) {
  if (!arquivo) {
    return (
      <p>
        Nenhum arquivo selecionado.
      </p>
    )
  }

  if (!TIPOS_PERMITIDOS.includes(arquivo.type)) {
    return (
      <p className="erro" role="alert">
        Tipo de arquivo inválido. Apenas PDF, JPG e PNG são permitidos.
      </p>
    )
  }

  if (arquivo.size > TAMANHO_MAXIMO) {
    return (
      <p className="erro" role="alert">
        O arquivo excede o tamanho máximo permitido de 10 MB.
      </p>
    )
  }

  return (
    <p className="sucesso" role="status">
      Arquivo válido: {arquivo.name}
    </p>
  )
}
