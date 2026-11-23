import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import PassoPaciente from './PassoPaciente'
import type { PacienteOpcao } from '../types'

const titularEMenor: PacienteOpcao[] = [
  { dependenteId: null, nome: 'Joao', relacao: 'Titular' },
  { dependenteId: 7, nome: 'Miguel', relacao: 'Filho' },
]

describe('PassoPaciente (T30-FE1)', () => {
  it('mostra Você (titular) e cada menor sob a guarda, com o aviso sobre maiores', () => {
    render(<PassoPaciente pacientes={titularEMenor} maioresNomes={['Helena']} value={undefined} onChange={vi.fn()} />)

    expect(screen.getByLabelText('Você (titular)')).toBeInTheDocument()
    expect(screen.getByLabelText('Miguel (seu dependente, menor sob sua guarda)')).toBeInTheDocument()
    expect(screen.getByText(/Dependentes maiores de idade \(como Helena\) não aparecem aqui/)).toBeInTheDocument()
  })

  it('sem dependentes maiores, o aviso não cita nomes', () => {
    render(<PassoPaciente pacientes={titularEMenor} maioresNomes={[]} value={undefined} onChange={vi.fn()} />)

    expect(screen.getByText(/Dependentes maiores de idade não aparecem aqui/)).toBeInTheDocument()
  })

  it('escolher um menor devolve o dependenteId dele', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PassoPaciente pacientes={titularEMenor} maioresNomes={[]} value={undefined} onChange={onChange} />)

    await user.click(screen.getByLabelText('Miguel (seu dependente, menor sob sua guarda)'))

    expect(onChange).toHaveBeenCalledWith(7)
  })

  it('escolher o próprio titular devolve null', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<PassoPaciente pacientes={titularEMenor} maioresNomes={[]} value={7} onChange={onChange} />)

    await user.click(screen.getByLabelText('Você (titular)'))

    expect(onChange).toHaveBeenCalledWith(null)
  })
})
