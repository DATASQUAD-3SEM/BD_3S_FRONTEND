import EmConstrucao from '../../../../shared/components/EmConstrucao'

interface Props {
  arquivo: File | null
}

/** SCRUM 24 - feedback visual de sucesso/erro do arquivo escolhido. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default function FeedbackUpload(_props: Props) {
  return <EmConstrucao nome="FeedbackUpload" task="SCRUM 24" />
}
