import type { PacienteOpcao } from '../types'

interface Props {
  /** Pacientes possiveis (mais de um: o passo aparece; com um so, a tela nem mostra o passo). */
  pacientes: PacienteOpcao[]
  /** Nomes dos dependentes maiores de idade do titular, para o aviso. Vazio = o aviso nao cita nomes. */
  maioresNomes: string[]
  /** dependenteId escolhido; null = o proprio titular; undefined = ainda nao escolheu. */
  value: number | null | undefined
  onChange: (dependenteId: number | null) => void
}

/**
 * Passo "1. Paciente" da nova pre-guia (T30-FE1): para quem e a pre-guia. Cada menor que o usuario acompanha aparece
 * como opcao propria. Dependentes maiores nao aparecem: criam as proprias pre-guias.
 */
export default function PassoPaciente({ pacientes, maioresNomes, value, onChange }: Props) {
  const citacaoMaiores = maioresNomes.length > 0 ? ` (como ${maioresNomes.join(', ')})` : ''

  return (
    <fieldset>
      <legend>1. Paciente</legend>
      <p>Para quem é esta pré-guia?</p>

      {pacientes.map((paciente) => {
        const id = paciente.dependenteId === null ? 'titular' : String(paciente.dependenteId)
        const rotulo =
          paciente.dependenteId === null ? 'Você (titular)' : `${paciente.nome} (seu dependente, menor sob sua guarda)`
        return (
          <label key={id} htmlFor={`paciente-${id}`}>
            <input
              id={`paciente-${id}`}
              type="radio"
              name="paciente"
              checked={value === paciente.dependenteId}
              onChange={() => onChange(paciente.dependenteId)}
            />{' '}
            {rotulo}
          </label>
        )
      })}

      <p className="sf-pequeno">
        Dependentes maiores de idade{citacaoMaiores} não aparecem aqui: eles criam as próprias pré-guias. Dependentes
        com vigência encerrada também não aparecem.
      </p>
    </fieldset>
  )
}
