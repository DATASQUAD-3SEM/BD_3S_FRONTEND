import { afterEach, describe, it, expect, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import MedicosPage from './MedicosPage'
import { ApiError } from '../../shared/api/http'
import type { ListaMedicos, MedicoDetalhe, MedicosApi } from './tipos'

/**
 * Testes da tela Medicos do Chefe (T8-FE): lista, filtros, cadastro, edicao e duplicidades.
 */

const lista: ListaMedicos = {
  total: 2,
  pagina: 0,
  tamanho: 10,
  itens: [
    { id: 1, nome: 'Cap Méd Ribeiro', cpf: '22233344455', precCp: '45890010003', crm: '000000-SP', ativo: true },
    { id: 3, nome: 'Ten Méd Andrade', cpf: '99988877766', precCp: '45890030005', crm: '222222-SP', ativo: false },
  ],
}

const detalhe: MedicoDetalhe = { ...lista.itens[0], patente: 'Capitão' }

function criarApi(sobrescrever: Partial<MedicosApi> = {}): MedicosApi {
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

async function preencherNovoMedico(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByLabelText('Nome'), 'Maj Méd Teixeira')
  await user.type(screen.getByLabelText('Patente'), 'Major')
  await user.type(screen.getByLabelText('CPF (será o login)'), '52998224725')
  await user.type(screen.getByLabelText('Prec CP'), '45890020004')
  await user.type(screen.getByLabelText('CRM'), '111111-SP')
  await user.type(screen.getByLabelText('Senha inicial'), 'Senha12345')
}

describe('T8-FE · Tela Médicos', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('mostra carregamento e lista apenas ativos por padrão', async () => {
    const api = criarApi()
    render(<MedicosPage api={api} />)

    expect(screen.getByLabelText('Carregando médicos')).toBeInTheDocument()
    await screen.findByText('Cap Méd Ribeiro')

    expect(api.listar).toHaveBeenCalledWith(
      expect.objectContaining({ situacao: 'ativos', busca: '', page: 0 }),
    )
    expect(within(linhaDe('Cap Méd Ribeiro')).getByText('Ativo')).toBeInTheDocument()
    expect(within(linhaDe('Ten Méd Andrade')).getByText('Inativo')).toBeInTheDocument()
  })

  it('mostra Desativar para ativos e Reativar para inativos', async () => {
    render(<MedicosPage api={criarApi()} />)
    await screen.findByText('Cap Méd Ribeiro')

    expect(within(linhaDe('Cap Méd Ribeiro')).getByRole('button', { name: 'Desativar' })).toBeInTheDocument()
    expect(within(linhaDe('Ten Méd Andrade')).getByRole('button', { name: 'Reativar' })).toBeInTheDocument()
  })

  it('mostra o estado vazio quando não há médicos', async () => {
    const api = criarApi({
      listar: vi.fn().mockResolvedValue({ total: 0, pagina: 0, tamanho: 10, itens: [] }),
    })
    render(<MedicosPage api={api} />)

    expect(await screen.findByText('Nenhum médico encontrado.')).toBeInTheDocument()
  })

  it('mostra erro e tenta novamente ao clicar', async () => {
    const user = userEvent.setup()
    const api = criarApi({
      listar: vi
        .fn()
        .mockRejectedValueOnce(new ApiError(500, 'Erro interno'))
        .mockResolvedValue(lista),
    })
    render(<MedicosPage api={api} />)

    expect(await screen.findByText('Não foi possível carregar os médicos.')).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    await screen.findByText('Cap Méd Ribeiro')
    await waitFor(() => expect(api.listar).toHaveBeenCalledTimes(2))
  })

  it('pede confirmação antes de desativar', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(true)
    const api = criarApi()
    render(<MedicosPage api={api} />)
    await screen.findByText('Cap Méd Ribeiro')

    await user.click(within(linhaDe('Cap Méd Ribeiro')).getByRole('button', { name: 'Desativar' }))

    expect(window.confirm).toHaveBeenCalled()
    expect(api.alterarSituacao).toHaveBeenCalledWith(1, false)
  })

  it('não desativa quando o chefe cancela a confirmação', async () => {
    const user = userEvent.setup()
    vi.spyOn(window, 'confirm').mockReturnValue(false)
    const api = criarApi()
    render(<MedicosPage api={api} />)
    await screen.findByText('Cap Méd Ribeiro')

    await user.click(within(linhaDe('Cap Méd Ribeiro')).getByRole('button', { name: 'Desativar' }))

    expect(api.alterarSituacao).not.toHaveBeenCalled()
  })

  it('mostra erros de validação ao enviar o formulário vazio', async () => {
    const user = userEvent.setup()
    render(<MedicosPage api={criarApi()} />)
    await screen.findByText('Cap Méd Ribeiro')

    await user.click(screen.getByRole('button', { name: 'Cadastrar médico' }))

    expect(screen.getByText('O nome é obrigatório.')).toBeInTheDocument()
    expect(screen.getByText('Informe o CPF.')).toBeInTheDocument()
  })

  it('mostra o 409 de CPF duplicado no campo CPF', async () => {
    const user = userEvent.setup()
    const api = criarApi({
      cadastrar: vi
        .fn()
        .mockRejectedValue(new ApiError(409, 'CPF ja cadastrado', ['cpf: CPF ja cadastrado'])),
    })
    render(<MedicosPage api={api} />)
    await screen.findByText('Cap Méd Ribeiro')

    await preencherNovoMedico(user)
    await user.click(screen.getByRole('button', { name: 'Cadastrar médico' }))

    expect(await screen.findByText('CPF ja cadastrado')).toBeInTheDocument()
    expect(api.cadastrar).toHaveBeenCalledWith({
      nome: 'Maj Méd Teixeira',
      patente: 'Major',
      cpf: '52998224725',
      precCp: '45890020004',
      crm: '111111-SP',
      senha: 'Senha12345',
    })
  })

  it('abre o modo de edição com os dados do médico', async () => {
    const user = userEvent.setup()
    render(<MedicosPage api={criarApi()} />)
    await screen.findByText('Cap Méd Ribeiro')

    await user.click(within(linhaDe('Cap Méd Ribeiro')).getByRole('button', { name: 'Editar' }))

    expect(await screen.findByText('Editando médico')).toBeInTheDocument()
    expect(screen.getByLabelText('Patente')).toHaveValue('Capitão')
    expect(screen.getByLabelText('CPF (será o login)')).toHaveValue('222.333.444-55')
  })
})
