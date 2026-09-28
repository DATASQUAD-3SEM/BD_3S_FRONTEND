interface Props {
  nome: string
  task: string
  dono?: string
}

/** Marcador de "isto ainda sera implementado". Apague e coloque o componente de verdade. */
export default function EmConstrucao({ nome, task, dono = 'a definir' }: Props) {
  return (
    <div className="em-construcao" role="note">
      <strong>{nome}</strong>
      <span>
        {task} · dono: {dono}
      </span>
    </div>
  )
}
