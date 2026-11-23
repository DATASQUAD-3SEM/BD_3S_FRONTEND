/** Paciente de uma pre-guia ou Guia na lista do beneficiario (campo paciente, correcao da T30-BE3). */
export interface PacienteDaLista {
  dependenteId: number | null
  nome: string
  relacao: string
  menor: boolean
  voceResponsavel: boolean
  vigenciaFim: string | null
}

/**
 * Texto da linha "Paciente" (T30-FE2): "Você" para o titular; para dependente, o nome, a relação e "menor de idade"
 * quando for menor, e "você é o responsável legal" quando o usuário logado for o responsável deste menor.
 */
export function textoPaciente(paciente: PacienteDaLista): string {
  if (paciente.dependenteId === null) {
    return 'Você'
  }
  const detalhes = [paciente.relacao, paciente.menor ? 'menor de idade' : null].filter(Boolean).join(', ')
  const base = `${paciente.nome} (${detalhes})`
  return paciente.voceResponsavel ? `${base} · você é o responsável legal` : base
}
