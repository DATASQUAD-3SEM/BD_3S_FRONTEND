import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import TabelaBeneficiarios from './TabelaBeneficiarios'
import type { Beneficiario } from '../../types'

const ativo: Beneficiario = {
  id: 1, nome: 'Antonio Carlos Ferreira', cpf: '12345678900', precCp: '45872213300',
  dataNascimento: '1978-03-14', telefone: '1299', ativo: true,
}
const inativo: Beneficiario = {
  id: 3, nome: 'João Pereira Alves', cpf: '11122233344', precCp: '45830040002',
  dataNascimento: '1990-07-21', telefone: '1298', ativo: false,
}

function renderizar(extra: Partial<React.ComponentProps<typeof TabelaBeneficiarios>> = {}) {
  const props = {
    beneficiarios: [ativo, inativo],
    editandoId: null,
    onEditar: vi.fn(),
    onAlternarSituacao: vi.fn(),
    ...extra,
  }
  render(<TabelaBeneficiarios {...props} />)
  return props
}

describe('TabelaBeneficiarios', () => {
  it('mostra CPF e Prec CP formatados e a situação', () => {
    renderizar()

    expect(screen.getByText('123.456.789-00')).toBeInTheDocument()
    expect(screen.getByText('458722133-00')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
    expect(screen.getByText('Inativo')).toBeInTheDocument()
  })

  it('ativo tem "Desativar" e inativo tem "Reativar"', () => {
    renderizar()

    expect(screen.getByRole('button', { name: 'Desativar Antonio Carlos Ferreira' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Reativar João Pereira Alves' })).toBeInTheDocument()
  })

  it('Editar e Desativar avisam o container com o beneficiário', () => {
    const props = renderizar()

    fireEvent.click(screen.getByRole('button', { name: 'Editar Antonio Carlos Ferreira' }))
    expect(props.onEditar).toHaveBeenCalledWith(ativo)

    fireEvent.click(screen.getByRole('button', { name: 'Desativar Antonio Carlos Ferreira' }))
    expect(props.onAlternarSituacao).toHaveBeenCalledWith(ativo)
  })

  it('destaca a linha que está sendo editada', () => {
    renderizar({ editandoId: 3 })

    const linhas = screen.getAllByRole('row')
    expect(linhas[1]).toHaveAttribute('data-editando', 'false')
    expect(linhas[2]).toHaveAttribute('data-editando', 'true')
  })

  it('lista vazia mostra mensagem', () => {
    renderizar({ beneficiarios: [] })

    expect(screen.getByText('Nenhum beneficiário encontrado.')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
})
