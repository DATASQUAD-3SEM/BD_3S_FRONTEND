import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import BeneficiariosPage from '.'
import {
  alterarSituacao,
  atualizarBeneficiario,
  cadastrarBeneficiario,
  listarBeneficiarios,
} from '../api'
import type { Beneficiario } from '../types'

vi.mock('../api', () => ({
  listarBeneficiarios: vi.fn(),
  cadastrarBeneficiario: vi.fn(),
  atualizarBeneficiario: vi.fn(),
  alterarSituacao: vi.fn(),
}))

const antonio: Beneficiario = {
  id: 1, nome: 'Antonio Carlos Ferreira', cpf: '12345678900', precCp: '45872213300',
  dataNascimento: '1978-03-14', telefone: '(12) 99123-4567', ativo: true,
}
const marta: Beneficiario = {
  id: 2, nome: 'Marta Souza Lima', cpf: '98765432100', precCp: '45810020001',
  dataNascimento: '1952-11-02', telefone: '(12) 3653-1122', ativo: true,
}
const joao: Beneficiario = {
  id: 3, nome: 'João Pereira Alves', cpf: '11122233344', precCp: '45830040002',
  dataNascimento: '1990-07-21', telefone: '(12) 98888-0000', ativo: false,
}

function preencher(rotulo: string, valor: string) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } })
}

beforeEach(() => {
  vi.mocked(listarBeneficiarios).mockReset()
  vi.mocked(cadastrarBeneficiario).mockReset()
  vi.mocked(atualizarBeneficiario).mockReset()
  vi.mocked(alterarSituacao).mockReset()
  vi.mocked(listarBeneficiarios).mockResolvedValue([antonio, marta, joao])
})

describe('BeneficiariosPage', () => {
  it('por padrão lista todos os beneficiários, ativos e inativos', async () => {
    render(<BeneficiariosPage />)

    expect(await screen.findByText('Antonio Carlos Ferreira')).toBeInTheDocument()
    expect(screen.getByText('Marta Souza Lima')).toBeInTheDocument()
    expect(screen.getByText('João Pereira Alves')).toBeInTheDocument()
    expect((screen.getByLabelText('Filtrar por situação') as HTMLSelectElement).value).toBe('todos')
  })

  it('o filtro restringe a Ativos ou Inativos', async () => {
    render(<BeneficiariosPage />)
    await screen.findByText('Antonio Carlos Ferreira')

    fireEvent.change(screen.getByLabelText('Filtrar por situação'), { target: { value: 'ativos' } })
    expect(screen.getByText('Marta Souza Lima')).toBeInTheDocument()
    expect(screen.queryByText('João Pereira Alves')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Filtrar por situação'), { target: { value: 'inativos' } })
    expect(screen.getByText('João Pereira Alves')).toBeInTheDocument()
    expect(screen.queryByText('Marta Souza Lima')).not.toBeInTheDocument()
  })

  it('busca por nome, CPF ou Prec CP', async () => {
    render(<BeneficiariosPage />)
    await screen.findByText('Antonio Carlos Ferreira')

    fireEvent.change(screen.getByLabelText('Buscar beneficiário'), { target: { value: 'marta' } })
    expect(screen.queryByText('Antonio Carlos Ferreira')).not.toBeInTheDocument()
    expect(screen.getByText('Marta Souza Lima')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Buscar beneficiário'), { target: { value: '123.456.789-00' } })
    expect(screen.getByText('Antonio Carlos Ferreira')).toBeInTheDocument()
    expect(screen.queryByText('Marta Souza Lima')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Buscar beneficiário'), { target: { value: '458100200' } })
    expect(screen.getByText('Marta Souza Lima')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Buscar beneficiário'), { target: { value: 'zzz' } })
    expect(screen.getByText('Nenhum beneficiário encontrado.')).toBeInTheDocument()
  })

  it('cadastra um novo beneficiário, mostra na lista e limpa o formulário', async () => {
    const criado: Beneficiario = {
      id: 9, nome: 'Nova Pessoa', cpf: '55566677788', precCp: '45899900011',
      dataNascimento: '1990-05-20', telefone: '(12) 90000-0000', ativo: true,
    }
    vi.mocked(cadastrarBeneficiario).mockResolvedValue(criado)
    render(<BeneficiariosPage />)
    await screen.findByText('Antonio Carlos Ferreira')

    preencher('Nome', 'Nova Pessoa')
    preencher('CPF (será o login)', '55566677788')
    preencher('Prec CP', '45899900011')
    preencher('Data de nascimento', '1990-05-20')
    preencher('Telefone', '(12) 90000-0000')
    preencher('Senha inicial', 'abc123')
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar beneficiário' }))

    expect(await screen.findByText('Beneficiário Nova Pessoa cadastrado.')).toBeInTheDocument()
    expect(cadastrarBeneficiario).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Nova Pessoa', cpf: '55566677788', senha: 'abc123' }),
    )
    expect(screen.getByRole('cell', { name: 'Nova Pessoa' })).toBeInTheDocument()
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('')
  })

  it('erro no cadastro mostra a mensagem e mantém os dados digitados', async () => {
    vi.mocked(cadastrarBeneficiario).mockRejectedValue(new Error('Já existe um usuário com este CPF.'))
    render(<BeneficiariosPage />)
    await screen.findByText('Antonio Carlos Ferreira')

    preencher('Nome', 'Nova Pessoa')
    preencher('CPF (será o login)', '12345678900')
    preencher('Prec CP', '45899900011')
    preencher('Data de nascimento', '1990-05-20')
    preencher('Telefone', '1290')
    preencher('Senha inicial', 'abc123')
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar beneficiário' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe um usuário com este CPF.')
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Nova Pessoa')
  })

  it('Editar preenche o formulário, destaca a linha e Salvar atualiza', async () => {
    vi.mocked(atualizarBeneficiario).mockResolvedValue({ ...antonio, telefone: '(12) 90000-1111' })
    render(<BeneficiariosPage />)
    await screen.findByText('Antonio Carlos Ferreira')

    fireEvent.click(screen.getByRole('button', { name: 'Editar Antonio Carlos Ferreira' }))

    expect(screen.getByRole('heading', { name: 'Editando beneficiário' })).toBeInTheDocument()
    expect(screen.getByText('Modo de edição')).toBeInTheDocument()
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Antonio Carlos Ferreira')
    expect(screen.getAllByRole('row')[1]).toHaveAttribute('data-editando', 'true')

    preencher('Telefone', '(12) 90000-1111')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Alterações em Antonio Carlos Ferreira salvas.')).toBeInTheDocument()
    expect(atualizarBeneficiario).toHaveBeenCalledWith(1, expect.objectContaining({ telefone: '(12) 90000-1111' }))
    expect(screen.getByRole('heading', { name: 'Novo beneficiário' })).toBeInTheDocument()
    expect(screen.queryByText('Modo de edição')).not.toBeInTheDocument()
  })

  it('o Chefe também edita um beneficiário inativo (todos os dados)', async () => {
    vi.mocked(atualizarBeneficiario).mockResolvedValue({ ...joao, nome: 'João P. Alves', precCp: '45830040009' })
    render(<BeneficiariosPage />)
    await screen.findByText('João Pereira Alves')

    fireEvent.click(screen.getByRole('button', { name: 'Editar João Pereira Alves' }))
    expect((screen.getByLabelText('Situação') as HTMLSelectElement).value).toBe('inativo')

    preencher('Nome', 'João P. Alves')
    preencher('CPF (login)', '11122233355')
    preencher('Prec CP', '45830040009')
    preencher('Data de nascimento', '1991-01-10')
    preencher('Telefone', '(12) 97777-0000')
    preencher('Nova senha (deixe em branco para manter)', 'novaSenha1')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Alterações em João P. Alves salvas.')).toBeInTheDocument()
    expect(atualizarBeneficiario).toHaveBeenCalledWith(
      3,
      expect.objectContaining({
        nome: 'João P. Alves', cpf: '11122233355', precCp: '45830040009',
        dataNascimento: '1991-01-10', telefone: '(12) 97777-0000', senha: 'novaSenha1', ativo: false,
      }),
    )
  })

  it('Cancelar a edição volta ao formulário de novo cadastro', async () => {
    render(<BeneficiariosPage />)
    await screen.findByText('Antonio Carlos Ferreira')

    fireEvent.click(screen.getByRole('button', { name: 'Editar Marta Souza Lima' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.getByRole('heading', { name: 'Novo beneficiário' })).toBeInTheDocument()
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('')
  })

  it('Desativar mantém o beneficiário na lista como Inativo (histórico preservado)', async () => {
    vi.mocked(alterarSituacao).mockResolvedValue({ ...antonio, ativo: false })
    render(<BeneficiariosPage />)
    await screen.findByText('Antonio Carlos Ferreira')

    fireEvent.click(screen.getByRole('button', { name: 'Desativar Antonio Carlos Ferreira' }))

    expect(await screen.findByText(/Antonio Carlos Ferreira desativado\. O histórico foi mantido\./)).toBeInTheDocument()
    expect(alterarSituacao).toHaveBeenCalledWith(1, false)
    expect(screen.getByRole('button', { name: 'Reativar Antonio Carlos Ferreira' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Filtrar por situação'), { target: { value: 'ativos' } })
    expect(screen.queryByRole('cell', { name: 'Antonio Carlos Ferreira' })).not.toBeInTheDocument()
  })

  it('Reativar devolve o beneficiário aos ativos', async () => {
    vi.mocked(alterarSituacao).mockResolvedValue({ ...joao, ativo: true })
    render(<BeneficiariosPage />)
    await screen.findByText('Antonio Carlos Ferreira')

    fireEvent.click(screen.getByRole('button', { name: 'Reativar João Pereira Alves' }))

    expect(await screen.findByText('João Pereira Alves reativado.')).toBeInTheDocument()
    expect(alterarSituacao).toHaveBeenCalledWith(3, true)
  })

  it('mostra erro quando a lista não carrega', async () => {
    vi.mocked(listarBeneficiarios).mockRejectedValue(new Error('Sem resposta do servidor'))
    render(<BeneficiariosPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Sem resposta do servidor')
  })
})
