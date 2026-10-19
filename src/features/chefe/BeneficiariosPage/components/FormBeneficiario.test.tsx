import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import FormBeneficiario from './FormBeneficiario.tsx'
import type { Beneficiario } from '../../typesBeneficiarios.ts'

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

  it('CPF aceita só números, limita a 11 dígitos e mostra a máscara', () => {
    render(<FormBeneficiario editando={null} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    preencher('CPF (será o login)', '123.456.789-00999')

    expect((screen.getByLabelText('CPF (será o login)') as HTMLInputElement).value).toBe('123.456.789-00')
  })

  it('Prec CP aceita só números, limita a 11 dígitos e mostra a máscara', () => {
    render(<FormBeneficiario editando={null} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    preencher('Prec CP', 'ab458722133-00999')

    expect((screen.getByLabelText('Prec CP') as HTMLInputElement).value).toBe('458722133-00')
  })

  it('CPF ou Prec CP com menos de 11 dígitos bloqueia o cadastro', () => {
    render(<FormBeneficiario editando={null} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    preencher('Nome', 'Nova Pessoa')
    preencher('CPF (será o login)', '1234567890')
    preencher('Prec CP', '4587221330')
    preencher('Data de nascimento', '1990-05-20')
    preencher('Telefone', '12991542346')
    preencher('Senha inicial', 'abc123')

    expect(screen.getByRole('button', { name: 'Cadastrar beneficiário' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(/CPF com 11 dígitos, Prec CP com 11 dígitos/)
  })

  it('no cadastro novo não aparece o selo "Modo de edição"', () => {
    render(<FormBeneficiario editando={null} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    expect(screen.queryByText('Modo de edição')).not.toBeInTheDocument()
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
        dataNascimento: '1990-05-20', telefone: '12900000000', senha: 'abc123',
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
  it('mostra o selo "Modo de edição" e destaca o painel', () => {
    const { container } = render(
      <FormBeneficiario editando={existente} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />,
    )

    expect(screen.getByText('Modo de edição')).toBeInTheDocument()
    expect(container.querySelector('section')).toHaveClass('painel-edicao')
  })

  it('vem preenchido (com máscara), com faixa etária calculada e situação', () => {
    render(<FormBeneficiario editando={existente} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Editando beneficiário' })).toBeInTheDocument()
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Antonio Carlos Ferreira')
    expect((screen.getByLabelText('CPF (login)') as HTMLInputElement).value).toBe('123.456.789-00')
    expect((screen.getByLabelText('Prec CP') as HTMLInputElement).value).toBe('458722133-00')
    expect((screen.getByLabelText('Telefone') as HTMLInputElement).value).toBe('(12)99123-4567')
    expect(screen.getByText('41 a 50 (45 anos)')).toBeInTheDocument()
    expect(screen.getByText('Cancelar descarta as mudanças e volta para o formulário de novo cadastro.')).toBeInTheDocument()
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
    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ senha: '', ativo: true, telefone: '12991234567' }))
  })

  it('permite mudar a situação para Inativo', () => {
    const onSubmit = vi.fn()
    render(<FormBeneficiario editando={existente} salvando={false} onSubmit={onSubmit} onCancelar={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Situação'), { target: { value: 'inativo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ ativo: false }))
  })

  it('a senha é opcional e o rótulo explica que vazio mantém a atual', () => {
    render(<FormBeneficiario editando={existente} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    expect(screen.getByLabelText('Nova senha (deixe em branco para manter)')).toBeInTheDocument()
  })

  it('apagar o nome bloqueia o salvar', () => {
    render(<FormBeneficiario editando={existente} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    preencher('Nome', '')

    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(/Para salvar, falta preencher: nome/)
  })
})

describe('FormBeneficiario — telefone', () => {
  function preencherTudoMenosTelefone() {
    preencher('Nome', 'Nova Pessoa')
    preencher('CPF (será o login)', '55566677788')
    preencher('Prec CP', '45899900011')
    preencher('Data de nascimento', '1990-05-20')
    preencher('Senha inicial', 'abc123')
  }

  it('aceita só números, limita a 11 dígitos e mostra a máscara', () => {
    render(<FormBeneficiario editando={null} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    preencher('Telefone', '(12) 99154-2346999')

    expect((screen.getByLabelText('Telefone') as HTMLInputElement).value).toBe('(12)99154-2346')
  })

  it('aplica a máscara aos poucos, enquanto digita', () => {
    render(<FormBeneficiario editando={null} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    preencher('Telefone', '1299')

    expect((screen.getByLabelText('Telefone') as HTMLInputElement).value).toBe('(12)99')
  })

  it.each([
    ['1233334444', 'fixo, com 10 dígitos'],
    ['12800000000', 'sem o 9 depois do DDD'],
    ['01991542346', 'DDD começando com 0'],
  ])('telefone %s (%s) bloqueia o cadastro', (numero) => {
    render(<FormBeneficiario editando={null} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    preencherTudoMenosTelefone()
    preencher('Telefone', numero)

    expect(screen.getByRole('button', { name: 'Cadastrar beneficiário' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(/telefone no formato \(12\)99999-9999/)
  })

  it('celular válido habilita o cadastro', () => {
    render(<FormBeneficiario editando={null} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    preencherTudoMenosTelefone()
    preencher('Telefone', '(12)99154-2346')

    expect(screen.getByRole('button', { name: 'Cadastrar beneficiário' })).toBeEnabled()
  })
})
