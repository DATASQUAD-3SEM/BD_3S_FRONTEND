import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import TabelaMedicos from './TabelaMedicos.tsx'
import type { Medico } from '../../typesMedicos.ts'

const ativo: Medico = {
  id: 1, nome: 'Helena Duarte Quintanilha', patente: 'Maj Med', cpf: '12345678901',
  precCp: '00987654321', crm: 'CRM-SP 123456', ativo: true,
}
const inativo: Medico = {
  id: 3, nome: 'Sérgio Lemos Vieira', patente: 'Ten Cel Med', cpf: '33344455566',
  precCp: '00555666777', crm: 'CRM-SP 112233', ativo: false,
}

function renderizar(extra: Partial<React.ComponentProps<typeof TabelaMedicos>> = {}) {
  const props = {
    medicos: [ativo, inativo],
    editandoId: null,
    onEditar: vi.fn(),
    onAlternarSituacao: vi.fn(),
    ...extra,
  }
  render(<TabelaMedicos {...props} />)
  return props
}

describe('TabelaMedicos', () => {
  it('tem as colunas Nome, CPF (login), Prec CP, CRM e Situação', () => {
    renderizar()

    for (const coluna of ['Nome', 'CPF (login)', 'Prec CP', 'CRM', 'Situação']) {
      expect(screen.getByRole('columnheader', { name: coluna })).toBeInTheDocument()
    }
  })

  it('mostra CPF e Prec CP formatados, CRM, patente e situação', () => {
    renderizar()

    expect(screen.getByText('123.456.789-01')).toBeInTheDocument()
    expect(screen.getByText('009876543-21')).toBeInTheDocument()
    expect(screen.getByText('CRM-SP 123456')).toBeInTheDocument()
    expect(screen.getByText('Maj Med')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
    expect(screen.getByText('Inativo')).toBeInTheDocument()
  })

  it('ativo tem "Desativar" e inativo tem "Reativar"', () => {
    renderizar()

    expect(screen.getByRole('button', { name: 'Desativar Helena Duarte Quintanilha' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reativar Sérgio Lemos Vieira' })).toBeInTheDocument()
  })

  it('Editar e Desativar avisam o container com o médico', () => {
    const props = renderizar()

    fireEvent.click(screen.getByRole('button', { name: 'Editar Helena Duarte Quintanilha' }))
    expect(props.onEditar).toHaveBeenCalledWith(ativo)

    fireEvent.click(screen.getByRole('button', { name: 'Desativar Helena Duarte Quintanilha' }))
    expect(props.onAlternarSituacao).toHaveBeenCalledWith(ativo)
  })

  it('destaca a linha que está sendo editada', () => {
    renderizar({ editandoId: 3 })

    const linhas = screen.getAllByRole('row')
    expect(linhas[1]).toHaveAttribute('data-editando', 'false')
    expect(linhas[2]).toHaveAttribute('data-editando', 'true')
  })

  it('lista vazia mostra mensagem', () => {
    renderizar({ medicos: [] })

    expect(screen.getByText('Nenhum médico encontrado.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
