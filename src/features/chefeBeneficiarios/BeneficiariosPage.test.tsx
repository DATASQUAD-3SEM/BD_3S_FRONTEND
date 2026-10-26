import { describe, it, expect, vi } from 'vitest'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import BeneficiariosPage from './BeneficiariosPage'
import type { BeneficiarioDetalhe, BeneficiariosApi, ListaBeneficiarios } from './tipos'

/**
 * Testes da tela Beneficiarios do Chefe (T7-FE): lista, filtros, cadastro, edicao e erros por campo.
 */

const lista: ListaBeneficiarios = {
  total: 2,
  pagina: 0,
  tamanho: 10,
  itens: [
    { id: 1, nome: 'Antonio Carlos Ferreira', cpf: '12345678900', precCp: '45872213300', ativo: true },
    { id: 3, nome: 'João Pereira Alves', cpf: '11122233344', precCp: '45830040002', ativo: false },
  ],
}

const detalhe: BeneficiarioDetalhe = {
  id: 1,
  nome: 'Antonio Carlos Ferreira',
  cpf: '12345678900',
  precCp: '45872213300',
  ativo: true,
  dataNascimento: '1968-05-10',
  telefone: '11987654321',
  faixaEtaria: '51 a 60',
  idade: 58,
}

function criarApi(sobrescrever: Partial<BeneficiariosApi> = {}): BeneficiariosApi {
  return {
    listar: vi.fn().mockResolvedValue(lista),
    cadastrar: vi.fn().mockResolvedValue({ id: 10 }),
    buscar: vi.fn().mockResolvedValue(detalhe),
    editar: vi.fn().mockResolvedValue(detalhe),
    alterarSituacao: vi.fn().mockResolvedValue({ id: 1, ativo: false }),
    ...sobrescrever,
  }
}

const linhaDe = (nome: string) => screen.getByText(nome).closest('tr') as HTMLElement

describe('T7-FE · Tela Beneficiários', () => {
  it('mostra carregamento e lista apenas ativos por padrão', async () => {
    const api = criarApi()
    render(<BeneficiariosPage api={api} />)

    expect(screen.getByLabelText('Carregando beneficiários')).toBeInTheDocument()
    await screen.findByText('Antonio Carlos Ferreira')

    expect(api.listar).toHaveBeenCalledWith(
      expect.objectContaining({ situacao: 'ativos', busca: '', page: 0 }),
    )
    expect(within(linhaDe('Antonio Carlos Ferreira')).getByText('Ativo')).toBeInTheDocument()
    expect(within(linhaDe('João Pereira Alves')).getByRole('button', { name: 'Reativar' })).toBeInTheDocument()
  })

  it('mostra o estado vazio', async () => {
    const listar = vi.fn().mockResolvedValue({ total: 0, pagina: 0, tamanho: 10, itens: [] })
    render(<BeneficiariosPage api={criarApi({ listar })} />)
    expect(await screen.findByText('Nenhum beneficiário encontrado.')).toBeInTheDocument()
  })

  it('mostra erro e tenta novamente', async () => {
    const listar = vi.fn().mockRejectedValueOnce(new Error('falha')).mockResolvedValueOnce(lista)
    render(<BeneficiariosPage api={criarApi({ listar })} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os beneficiários.')
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    await screen.findByText('Antonio Carlos Ferreira')
    expect(listar).toHaveBeenCalledTimes(2)
  })

  it('troca o filtro de situação e volta para a primeira página', async () => {
    const api = criarApi()
    render(<BeneficiariosPage api={api} />)
    await screen.findByText('Antonio Carlos Ferreira')

    await userEvent.selectOptions(screen.getByLabelText('Filtrar por situação'), 'inativos')

    await waitFor(() =>
      expect(api.listar).toHaveBeenLastCalledWith(expect.objectContaining({ situacao: 'inativos', page: 0 })),
    )
  })

  it('não envia o cadastro incompleto e mostra os erros', async () => {
    const api = criarApi()
    render(<BeneficiariosPage api={api} />)
    await screen.findByText('Antonio Carlos Ferreira')

    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar beneficiário' }))

    expect(await screen.findByText('O nome é obrigatório.')).toBeInTheDocument()
    expect(api.cadastrar).not.toHaveBeenCalled()
  })

  it('rejeita CPF inválido', async () => {
    const api = criarApi()
    render(<BeneficiariosPage api={api} />)
    await screen.findByText('Antonio Carlos Ferreira')

    const cpf = screen.getByLabelText('CPF (será o login)')
    await userEvent.type(cpf, '11111111111')
    expect(cpf).toHaveValue('111.111.111-11')

    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar beneficiário' }))
    expect(await screen.findByText('CPF inválido.')).toBeInTheDocument()
    expect(api.cadastrar).not.toHaveBeenCalled()
  })

  it('cadastra, limpa o formulário e atualiza a lista', async () => {
    const api = criarApi()
    render(<BeneficiariosPage api={api} />)
    await screen.findByText('Antonio Carlos Ferreira')

    await userEvent.type(screen.getByLabelText('Nome'), 'Maria Silva')
    await userEvent.type(screen.getByLabelText('CPF (será o login)'), '52998224725')
    await userEvent.type(screen.getByLabelText('Prec CP'), '45872213300')
    fireEvent.change(screen.getByLabelText('Data de nascimento'), { target: { value: '1990-01-01' } })
    await userEvent.type(screen.getByLabelText('Telefone'), '11987654321')
    await userEvent.type(screen.getByLabelText('Senha inicial'), '12345678')
    await userEvent.click(screen.getByRole('button', { name: 'Cadastrar beneficiário' }))

    await waitFor(() =>
      expect(api.cadastrar).toHaveBeenCalledWith({
        nome: 'Maria Silva',
        cpf: '52998224725',
        precCp: '45872213300',
        dataNascimento: '1990-01-01',
        telefone: '11987654321',
        senha: '12345678',
      }),
    )
    expect(screen.getByLabelText('Nome')).toHaveValue('')
    await waitFor(() => expect(api.listar).toHaveBeenCalledTimes(2))
  })

  it('abre o modo de edição e cancela voltando ao novo cadastro', async () => {
    const api = criarApi()
    render(<BeneficiariosPage api={api} />)
    await screen.findByText('Antonio Carlos Ferreira')

    await userEvent.click(within(linhaDe('Antonio Carlos Ferreira')).getByRole('button', { name: 'Editar' }))

    expect(await screen.findByRole('heading', { name: 'Editando beneficiário' })).toBeInTheDocument()
    expect(screen.getByText('Modo de edição')).toBeInTheDocument()
    expect(screen.getByLabelText('Nome')).toHaveValue('Antonio Carlos Ferreira')
    expect((screen.getByLabelText('Faixa etária') as HTMLInputElement).value).toMatch(/^51 a 60 \(\d+ anos\)$/)

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))
    expect(screen.getByRole('heading', { name: 'Novo beneficiário' })).toBeInTheDocument()
  })

  it('pede confirmação antes de desativar', async () => {
    const api = criarApi()
    const confirmar = vi.spyOn(window, 'confirm').mockReturnValue(true)
    render(<BeneficiariosPage api={api} />)
    await screen.findByText('Antonio Carlos Ferreira')

    await userEvent.click(within(linhaDe('Antonio Carlos Ferreira')).getByRole('button', { name: 'Desativar' }))

    await waitFor(() => expect(api.alterarSituacao).toHaveBeenCalledWith(1, false))
    expect(confirmar).toHaveBeenCalled()
    confirmar.mockRestore()
  })
})
