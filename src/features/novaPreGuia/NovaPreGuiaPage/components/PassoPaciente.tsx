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
/** Rotulo da opcao: o titular, o dependente maior logado, o menor sob a guarda do titular ou o do responsavel legal. */
function rotuloDoPaciente(paciente: PacienteOpcao): string {
  if (paciente.dependenteId === null) return 'Você (titular)'
  if (paciente.relacao === 'Você (dependente maior)') return 'Você (dependente maior)'
  if (paciente.relacao.startsWith('Menor que você acompanha')) {
    return `${paciente.nome} (menor que você acompanha como responsável legal)`
  }
  return `${paciente.nome} (seu dependente, menor sob sua guarda)`
}

export default function PassoPaciente({ pacientes, maioresNomes, value, onChange }: Props) {
  const citacaoMaiores = maioresNomes.length > 0 ? ` (como ${maioresNomes.join(', ')})` : ''

  return (
    <fieldset className="painel passo-paciente">
      <legend className="passo-paciente-titulo">1. Paciente</legend>
      <p className="passo-paciente-pergunta">Para quem é esta pré-guia?</p>

      <div className="passo-paciente-opcoes">
        {pacientes.map((paciente) => {
          const id = paciente.dependenteId === null ? 'titular' : String(paciente.dependenteId)
          const rotulo = rotuloDoPaciente(paciente)
          return (
            <label
              key={id}
              htmlFor={`paciente-${id}`}
              className={`passo-paciente-opcao${value === paciente.dependenteId ? ' passo-paciente-opcao--marcada' : ''}`}
            >
              <input
                id={`paciente-${id}`}
                type="radio"
                name="paciente"
                checked={value === paciente.dependenteId}
                onChange={() => onChange(paciente.dependenteId)}
              />
              <span>{rotulo}</span>
            </label>
          )
        })}
      </div>

      <p className="sf-pequeno">
        Dependentes maiores de idade{citacaoMaiores} não aparecem aqui: eles criam as próprias pré-guias. Dependentes
        com vigência encerrada também não aparecem.
      </p>
    </fieldset>
  )
}
