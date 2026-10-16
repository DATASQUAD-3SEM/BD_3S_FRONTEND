import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import FormBeneficiario from './FormBeneficiario'
import type { Beneficiario } from '../../types'

const ano = new Date().getFullYear()
const existente: Beneficiario = {
  id: 1, nome: 'Antonio Carlos Ferreira', cpf: '12345678900', precCp: '45872213300',
  dataNascimento: `${ano - 45}-01-01`, // sempre 45 anos -> faixa "41 a 50"
  telefone: '(12) 99123-4567', ativo: true,
}

function preencher(rotulo: string, valor: string) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } })
}

describe('FormBeneficiario — novo', () => {
  it('começa bloqueado e lista o que falta', () => {
    render(<FormBeneficiario editando={null} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Novo beneficiário' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cadastrar beneficiário' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(/falta preencher:.*nome.*CPF.*Prec CP.*nascimento.*telefone.*senha/)
    expect(screen.getByText(/assinatura digital é cadastrada pelo próprio beneficiário/)).toBeInTheDocument()
  })

  it('CPF aceita só números (até 11)', () => {
    render(<FormBeneficiario editando={null} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    preencher('CPF (será o login)', '123.456.789-00999')

    expect((screen.getByLabelText('CPF (será o login)') as HTMLInputElement).value).toBe('12345678900')
  })

  it('preenchido, habilita e envia os dados', () => {
    const onSubmit = vi.fn()
    render(<FormBeneficiario editando={null} salvando={false} onSubmit={onSubmit} onCancelar={vi.fn()} />)

    preencher('Nome', 'Nova Pessoa')
    preencher('CPF (será o login)', '55566677788')
    preencher('Prec CP', '45899900011')
    preencher('Data de nascimento', '1990-05-20')
    preencher('Telefone', '(12) 90000-0000')
    preencher('Senha inicial', 'abc123')

    const botao = screen.getByRole('button', { name: 'Cadastrar beneficiário' })
    expect(botao).toBeEnabled()
    fireEvent.click(botao)

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Nova Pessoa', cpf: '55566677788', precCp: '45899900011',
        dataNascimento: '1990-05-20', telefone: '(12) 90000-0000', senha: 'abc123',
      }),
    )
  })

  it('Cancelar avisa o container', () => {
    const onCancelar = vi.fn()
    render(<FormBeneficiario editando={null} salvando={false} onSubmit={vi.fn()} onCancelar={onCancelar} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onCancelar).toHaveBeenCalled()
  })
})

describe('FormBeneficiario — editando', () => {
  it('vem preenchido, com faixa etária calculada e situação', () => {
    render(<FormBeneficiario editando={existente} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Editando beneficiário' })).toBeInTheDocument()
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Antonio Carlos Ferreira')
    expect((screen.getByLabelText('Faixa etária (calculada)') as HTMLInputElement).value).toBe('41 a 50')
    expect((screen.getByLabelText('Situação') as HTMLSelectElement).value).toBe('ativo')
    expect(screen.queryByText(/assinatura digital é cadastrada/)).not.toBeInTheDocument()
  })

  it('a nova senha é opcional: já dá para salvar sem preencher', () => {
    const onSubmit = vi.fn()
    render(<FormBeneficiario editando={existente} salvando={false} onSubmit={onSubmit} onCancelar={vi.fn()} />)

    const botao = screen.getByRole('button', { name: 'Salvar alterações' })
    expect(botao).toBeEnabled()
    fireEvent.click(botao)

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ senha: '', ativo: true }))
  })

  it('permite mudar a situação para Inativo', () => {
    const onSubmit = vi.fn()
    render(<FormBeneficiario editando={existente} salvando={false} onSubmit={onSubmit} onCancelar={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Situação'), { target: { value: 'inativo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ ativo: false }))
  })

  it('apagar o nome bloqueia o salvar', () => {
    render(<FormBeneficiario editando={existente} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    preencher('Nome', '')

    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(/Para salvar, falta preencher: nome/)
  })
})
