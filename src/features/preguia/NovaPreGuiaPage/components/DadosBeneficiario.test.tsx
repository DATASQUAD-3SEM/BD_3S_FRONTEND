import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import DadosBeneficiario from './DadosBeneficiario'
import type { DadosBeneficiarioForm } from '../types'

const preenchido: DadosBeneficiarioForm = {
  nome: 'Antonio Carlos Ferreira',
  idade: '58',
  precCp: '45872213300',
  cpf: '123.456.789-00',
  telefone: '(12) 98765-4321',
}

describe('DadosBeneficiario (somente leitura)', () => {
  it('renderiza os 5 campos exigidos pelo manual (item 3.1)', () => {
    render(<DadosBeneficiario value={preenchido} />)

    expect(screen.getByText('Beneficiário')).toBeInTheDocument()
    expect(screen.getByText('Idade')).toBeInTheDocument()
    expect(screen.getByText('Telefone')).toBeInTheDocument()
    expect(screen.getByText('CPF')).toBeInTheDocument()
    expect(screen.getByText('Prec-CP')).toBeInTheDocument()
  })

  it('mostra os valores formatados (CPF, Prec-CP, idade com sufixo)', () => {
    render(<DadosBeneficiario value={preenchido} />)

    expect(screen.getByText('123.456.789-00')).toBeInTheDocument()
    expect(screen.getByText('458722133-00')).toBeInTheDocument()
    expect(screen.getByText('58 anos')).toBeInTheDocument()
    expect(screen.getByText('Exército Brasileiro · FUSEX')).toBeInTheDocument()
    expect(screen.getByText('51 a 60')).toBeInTheDocument()
  })

  it('nao possui campos editaveis (somente leitura)', () => {
    render(<DadosBeneficiario value={preenchido} />)

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
