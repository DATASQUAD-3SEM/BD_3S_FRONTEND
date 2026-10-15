import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import DadosMedico from './DadosMedico'
import type { MedicoLogado } from '../types'

const medico: MedicoLogado = {
  nome: 'Helena Duarte', patente: 'Maj Med', crm: 'CRM-SP 123456', cpf: '12345678901', precCp: '00987654321',
}

describe('DadosMedico (somente leitura)', () => {
  it('mostra patente, nome, CRM, CPF formatado e Prec-CP', () => {
    render(<DadosMedico value={medico} />)

    expect(screen.getByText('Maj Med Helena Duarte')).toBeInTheDocument()
    expect(screen.getByText('CRM-SP 123456')).toBeInTheDocument()
    expect(screen.getByText('123.456.789-01')).toBeInTheDocument()
    expect(screen.getByText('00987654321')).toBeInTheDocument()
  })

  it('não possui campos editáveis', () => {
    render(<DadosMedico value={medico} />)

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
