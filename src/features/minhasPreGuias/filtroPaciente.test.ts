import { describe, expect, it } from 'vitest'
import { filtrarPorPaciente, fraseDaLista, FILTRO_TITULAR, FILTRO_TODOS, temDependente } from './filtroPaciente'
import type { PacienteDaLista } from './paciente'

const titular: PacienteDaLista = { dependenteId: null, nome: 'Joao', relacao: 'Titular', menor: false, voceResponsavel: false, vigenciaFim: null }
const miguel: PacienteDaLista = { dependenteId: 7, nome: 'Miguel', relacao: 'Filho', menor: true, voceResponsavel: false, vigenciaFim: null }
const sofia: PacienteDaLista = { dependenteId: 8, nome: 'Sofia', relacao: 'Neta', menor: true, voceResponsavel: true, vigenciaFim: null }

const itens = [{ paciente: titular, id: 1 }, { paciente: miguel, id: 2 }, { paciente: undefined, id: 3 }]

describe('filtroPaciente (T30-FE2)', () => {
  it('só há dependente quando algum item não é do titular', () => {
    expect(temDependente([{ paciente: titular }])).toBe(false)
    expect(temDependente(itens)).toBe(true)
  })

  it('frase para o titular cita as dele e as dos menores', () => {
    expect(fraseDaLista(itens, 'pré-guias')).toBe(
      'Aqui aparecem as suas pré-guias e as dos dependentes menores de idade que você acompanha como responsável legal.',
    )
  })

  it('frase para o responsável externo (só menores) não cita as próprias', () => {
    expect(fraseDaLista([{ paciente: sofia }], 'guias')).toBe(
      'Aqui aparecem as guias dos dependentes menores de idade que você acompanha como responsável legal.',
    )
  })

  it('sem dependente, não há frase', () => {
    expect(fraseDaLista([{ paciente: titular }], 'guias')).toBeNull()
  })

  it('filtra por Todos, por Você e por um dependente', () => {
    expect(filtrarPorPaciente(itens, FILTRO_TODOS)).toHaveLength(3)
    expect(filtrarPorPaciente(itens, FILTRO_TITULAR).map((i) => i.id)).toEqual([1])
    expect(filtrarPorPaciente(itens, '7').map((i) => i.id)).toEqual([2])
  })
})
