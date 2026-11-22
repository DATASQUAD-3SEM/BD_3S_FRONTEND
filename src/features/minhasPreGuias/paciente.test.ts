import { describe, expect, it } from 'vitest'
import { textoPaciente, type PacienteDaLista } from './paciente'

const base: PacienteDaLista = {
  dependenteId: null,
  nome: 'Joao',
  relacao: 'Titular',
  menor: false,
  voceResponsavel: false,
  vigenciaFim: null,
}

describe('textoPaciente (T30-FE2)', () => {
  it('titular aparece como Você', () => {
    expect(textoPaciente(base)).toBe('Você')
  })

  it('menor sob a guarda do titular: nome, relação e menor de idade', () => {
    expect(textoPaciente({ ...base, dependenteId: 7, nome: 'Miguel', relacao: 'Filho', menor: true })).toBe(
      'Miguel (Filho, menor de idade)',
    )
  })

  it('menor cujo responsável legal é o usuário logado', () => {
    expect(
      textoPaciente({ ...base, dependenteId: 7, nome: 'Sofia', relacao: 'Neta', menor: true, voceResponsavel: true }),
    ).toBe('Sofia (Neta, menor de idade) · você é o responsável legal')
  })

  it('dependente maior: nome e relação, sem menor de idade', () => {
    expect(textoPaciente({ ...base, dependenteId: 9, nome: 'Helena', relacao: 'Conjuge' })).toBe('Helena (Conjuge)')
  })
})
