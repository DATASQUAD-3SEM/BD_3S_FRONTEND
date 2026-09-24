import EmConstrucao from '../../../../shared/components/EmConstrucao'

interface Props {
  value: File | null
  onChange: (arquivo: File | null) => void
}

/**
 * SCRUM 23 - upload do encaminhamento (foto ou PDF) com preview.
 * Dica celular: <input type="file" accept="image/*,application/pdf"> ja oferece a camera.
 */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function UploadEncaminhamento(_props: Props) {
  return <EmConstrucao nome="UploadEncaminhamento" task="SCRUM 23" />
}
