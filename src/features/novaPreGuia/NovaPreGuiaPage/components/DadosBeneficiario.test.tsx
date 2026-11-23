import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import DadosBeneficiario from './DadosBeneficiario'

import type {
  Beneficiario,
} from '../../../../shared/types/domain'

/**
 * Testes do bloco somente leitura com os dados do beneficiario.
 */

const preenchido: Beneficiario = {
  nome: 'Antonio Carlos Ferreira',
  precCp: '45872213300',
  cpf: '12345678900',
  telefone: '(12) 98765-4321',
  dataNascimento: '1968-05-10',
}

describe('DadosBeneficiario (somente leitura)', () => {
  it('renderiza os dados pessoais do beneficiário', () => {
    render(<DadosBeneficiario value={preenchido} />)

    expect(screen.getByText('Dados do paciente')).toBeInTheDocument()
    expect(screen.getByText('Nome')).toBeInTheDocument()
    expect(screen.getByText('Idade')).toBeInTheDocument()
    expect(screen.getByText('Telefone')).toBeInTheDocument()
    expect(screen.getByText('CPF')).toBeInTheDocument()
    expect(screen.getByText('Prec-CP')).toBeInTheDocument()
    expect(screen.getByText('Data de nascimento')).toBeInTheDocument()
    // T33-FE1: o campo "Grupo" (texto fixo, sem origem nas regras) saiu da tela.
    expect(screen.queryByText('Grupo')).not.toBeInTheDocument()
  })

  it('mostra valores formatados e derivados', () => {
    render(<DadosBeneficiario value={preenchido} />)

    expect(screen.getByText('123.456.789-00')).toBeInTheDocument()
    expect(screen.getByText('458722133-00')).toBeInTheDocument()
    expect(screen.getByText('58 anos')).toBeInTheDocument()
    expect(screen.getByText('10/05/1968')).toBeInTheDocument()
    expect(screen.getByText('51 a 60')).toBeInTheDocument()
  })

  it('nao possui campos editaveis (somente leitura)', () => {
    render(<DadosBeneficiario value={preenchido} />)

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
