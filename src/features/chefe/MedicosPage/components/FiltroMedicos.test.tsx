import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import FiltroMedicos from './FiltroMedicos.tsx'

describe('FiltroMedicos', () => {
  it('digitar na busca avisa o container', () => {
    const onBusca = vi.fn()
    render(<FiltroMedicos busca="" onBusca={onBusca} situacao="todos" onSituacao={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Buscar médico'), { target: { value: 'helena' } })

    expect(onBusca).toHaveBeenCalledWith('helena')
  })

  it('busca informa que aceita CRM e a situação pode ser trocada', () => {
    const onSituacao = vi.fn()
    render(<FiltroMedicos busca="" onBusca={vi.fn()} situacao="todos" onSituacao={onSituacao} />)

    expect(screen.getByPlaceholderText(/CRM/)).toBeInTheDocument()
    expect((screen.getByLabelText('Filtrar por situação') as HTMLSelectElement).value).toBe('todos')

    fireEvent.change(screen.getByLabelText('Filtrar por situação'), { target: { value: 'inativos' } })
    expect(onSituacao).toHaveBeenCalledWith('inativos')
  })
})
