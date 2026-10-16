import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import FiltroBeneficiarios from './FiltroBeneficiarios'

describe('FiltroBeneficiarios', () => {
  it('digitar na busca avisa o container', () => {
    const onBusca = vi.fn()
    render(<FiltroBeneficiarios busca="" onBusca={onBusca} situacao="ativos" onSituacao={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Buscar beneficiário'), { target: { value: 'marta' } })

    expect(onBusca).toHaveBeenCalledWith('marta')
  })

  it('mostra Ativos selecionado e permite trocar a situação', () => {
    const onSituacao = vi.fn()
    render(<FiltroBeneficiarios busca="" onBusca={vi.fn()} situacao="ativos" onSituacao={onSituacao} />)

    const select = screen.getByLabelText('Filtrar por situação') as HTMLSelectElement
    expect(select.value).toBe('ativos')

    fireEvent.change(select, { target: { value: 'inativos' } })
    expect(onSituacao).toHaveBeenCalledWith('inativos')
  })
})
