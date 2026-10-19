import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import FormMedico from './FormMedico.tsx'
import type { Medico } from '../../typesMedicos.ts'

const existente: Medico = {
  id: 1, nome: 'Helena Duarte Quintanilha', patente: 'Maj Med', cpf: '12345678901',
  precCp: '00987654321', crm: 'CRM-SP 123456', ativo: true,
}

function preencher(rotulo: string, valor: string) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } })
}

function preencherTudo() {
  preencher('Nome', 'Nova Médica')
  preencher('Patente', 'Cap Med')
  preencher('CPF (será o login)', '55566677788')
  preencher('Prec CP', '00111222333')
  preencher('CRM', 'CRM-SP 445566')
  preencher('Senha inicial', 'abc123')
}

describe('FormMedico — novo', () => {
  it('tem os campos Nome, Patente, CPF, Prec CP, CRM e Senha inicial', () => {
    render(<FormMedico editando={null} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    expect(screen.getByRole('heading', { name: 'Novo médico' })).toBeInTheDocument()
    for (const campo of ['Nome', 'Patente', 'CPF (será o login)', 'Prec CP', 'CRM', 'Senha inicial']) {
      expect(screen.getByLabelText(campo)).toBeInTheDocument()
    }
    expect(screen.queryByText('Modo de edição')).not.toBeInTheDocument()
    expect(screen.getByText(/assinatura digital é cadastrada pelo próprio médico/)).toBeInTheDocument()
  })

  it('começa bloqueado e lista o que falta', () => {
    render(<FormMedico editando={null} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    expect(screen.getByRole('button', { name: 'Cadastrar médico' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(/falta preencher:.*nome.*patente.*CPF.*Prec CP.*CRM.*senha/)
  })

  it('CPF e Prec CP aceitam só números, limitam a 11 dígitos e mostram a máscara', () => {
    render(<FormMedico editando={null} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    preencher('CPF (será o login)', '123.456.789-01999')
    preencher('Prec CP', 'ab009876543-21999')

    expect((screen.getByLabelText('CPF (será o login)') as HTMLInputElement).value).toBe('123.456.789-01')
    expect((screen.getByLabelText('Prec CP') as HTMLInputElement).value).toBe('009876543-21')
  })

  it('CPF ou Prec CP com menos de 11 dígitos bloqueia o cadastro', () => {
    render(<FormMedico editando={null} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    preencherTudo()
    preencher('CPF (será o login)', '1234567890')

    expect(screen.getByRole('button', { name: 'Cadastrar médico' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(/CPF com 11 dígitos/)
  })

  it('preenchido, habilita e envia os dados', () => {
    const onSubmit = vi.fn()
    render(<FormMedico editando={null} salvando={false} onSubmit={onSubmit} onCancelar={vi.fn()} />)

    preencherTudo()
    const botao = screen.getByRole('button', { name: 'Cadastrar médico' })
    expect(botao).toBeEnabled()
    fireEvent.click(botao)

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({
        nome: 'Nova Médica', patente: 'Cap Med', cpf: '55566677788',
        precCp: '00111222333', crm: 'CRM-SP 445566', senha: 'abc123',
      }),
    )
  })

  it('Cancelar avisa o container', () => {
    const onCancelar = vi.fn()
    render(<FormMedico editando={null} salvando={false} onSubmit={vi.fn()} onCancelar={onCancelar} />)

    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onCancelar).toHaveBeenCalled()
  })
})

describe('FormMedico — editando', () => {
  it('mostra o selo "Modo de edição", destaca o painel e vem preenchido', () => {
    const { container } = render(
      <FormMedico editando={existente} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />,
    )

    expect(screen.getByRole('heading', { name: 'Editando médico' })).toBeInTheDocument()
    expect(screen.getByText('Modo de edição')).toBeInTheDocument()
    expect(container.querySelector('section')).toHaveClass('painel-edicao')
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Helena Duarte Quintanilha')
    expect((screen.getByLabelText('Patente') as HTMLInputElement).value).toBe('Maj Med')
    expect((screen.getByLabelText('CPF (login)') as HTMLInputElement).value).toBe('123.456.789-01')
    expect((screen.getByLabelText('Prec CP') as HTMLInputElement).value).toBe('009876543-21')
    expect((screen.getByLabelText('CRM') as HTMLInputElement).value).toBe('CRM-SP 123456')
    expect((screen.getByLabelText('Situação') as HTMLSelectElement).value).toBe('ativo')
    expect(screen.getByText('Cancelar descarta as mudanças e volta para o formulário de novo cadastro.')).toBeInTheDocument()
  })

  it('a senha é opcional: já dá para salvar sem preencher', () => {
    const onSubmit = vi.fn()
    render(<FormMedico editando={existente} salvando={false} onSubmit={onSubmit} onCancelar={vi.fn()} />)

    expect(screen.getByLabelText('Nova senha (deixe em branco para manter)')).toBeInTheDocument()
    const botao = screen.getByRole('button', { name: 'Salvar alterações' })
    expect(botao).toBeEnabled()
    fireEvent.click(botao)

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ senha: '', ativo: true }))
  })

  it('permite mudar a situação para Inativo', () => {
    const onSubmit = vi.fn()
    render(<FormMedico editando={existente} salvando={false} onSubmit={onSubmit} onCancelar={vi.fn()} />)

    fireEvent.change(screen.getByLabelText('Situação'), { target: { value: 'inativo' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(onSubmit).toHaveBeenCalledWith(expect.objectContaining({ ativo: false }))
  })

  it('apagar o CRM bloqueia o salvar', () => {
    render(<FormMedico editando={existente} salvando={false} onSubmit={vi.fn()} onCancelar={vi.fn()} />)

    preencher('CRM', '')

    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(/Para salvar, falta preencher: CRM/)
  })
})
