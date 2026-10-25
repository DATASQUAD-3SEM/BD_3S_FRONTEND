import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'

import RevisaoResumo from './RevisaoResumo'
import { formVazio, type NovaPreGuiaForm } from '../types'
import type { Beneficiario } from '../../../../shared/types/domain'

/**
 * Testes do resumo de revisao da Nova pre-guia do beneficiario.
 */

const beneficiarioTeste: Beneficiario = {
  nome: 'Maria Silva',
  precCp: '45872213300',
  cpf: '11122233344',
  telefone: '11999999999',
  dataNascimento: `${new Date().getFullYear() - 40}-01-01`,
  grupo: 'Exército Brasileiro · FUSEX',
}

const ocs = { id: 1, nome: 'OCS Exemplo', contrato: 'EXEMPLO-001', tipo: 'OCS' }

describe('RevisaoResumo', () => {
  it('mostra avisos quando nada foi preenchido ainda', () => {
    render(<RevisaoResumo form={formVazio} beneficiario={null} />)

    expect(screen.getByText('Os dados do beneficiario ainda nao foram totalmente preenchidos.')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma OCS selecionada ainda.')).toBeInTheDocument()
    expect(screen.getByText('Nenhum arquivo anexado ainda.')).toBeInTheDocument()
  })

  it('mostra os dados formatados do beneficiario logado', () => {
    render(<RevisaoResumo form={formVazio} beneficiario={beneficiarioTeste} />)

    expect(screen.getByText(/Maria Silva/)).toBeInTheDocument()
    expect(screen.getByText(/111\.222\.333-44/)).toBeInTheDocument()
    expect(screen.getByText(/Idade:\s*40 anos/)).toBeInTheDocument()
    expect(screen.getByText(/Prec-CP:\s*458722133-00/)).toBeInTheDocument()
    expect(screen.getByText(/Telefone:\s*\(11\) 99999-9999/)).toBeInTheDocument()
  })

  it('mostra a OCS escolhida e o arquivo anexado', () => {
    const form: NovaPreGuiaForm = {
      ocs,
      arquivo: new File(['conteudo'], 'encaminhamento.pdf', { type: 'application/pdf' }),
    }
    render(<RevisaoResumo form={form} beneficiario={beneficiarioTeste} />)

    expect(screen.getByText('OCS Exemplo · Contrato: EXEMPLO-001 · OCS')).toBeInTheDocument()
    expect(screen.getByText('encaminhamento.pdf')).toBeInTheDocument()
  })

  it('nao possui campos editaveis', () => {
    const form: NovaPreGuiaForm = { ocs, arquivo: new File(['x'], 'foto.png', { type: 'image/png' }) }
    render(<RevisaoResumo form={form} beneficiario={beneficiarioTeste} />)

    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
