import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'
import DependenteFormPage from './DependenteFormPage'
import { vigenciaSugerida } from './regrasDependente'
import type { ChefeDependentesApi, ContaPorCpf, DependenteItem } from './tipos'

/** T31-FE3: adicionar e editar dependente (um só responsável por menor, reaproveitamento de conta). */

const miguel: DependenteItem = {
  dependenteId: 1, nome: 'Miguel Ferreira', vinculo: 'Filho', precCp: '12345678902', cpf: '39053344705',
  telefone: '12999990000', dataNascimento: '2020-03-21', idade: 6, tipo: 'MENOR_TITULAR', vigenciaFim: '2042-03-20',
  vigenciaVencida: false, temConta: false, responsaveis: [{ usuarioId: 1, nome: 'Antonio Ferreira', papel: 'TITULAR' }],
}

function criarApi(conta: ContaPorCpf = { situacao: 'NOVA', nome: null }) {
  return {
    listar: vi.fn().mockResolvedValue({ titularId: 1, titularNome: 'Antonio Ferreira', dependentes: [miguel] }),
    criar: vi.fn().mockResolvedValue(miguel),
    editar: vi.fn().mockResolvedValue(miguel),
    proximoPrecCp: vi.fn().mockResolvedValue({ precCp: '12345678906' }),
    consultarConta: vi.fn().mockResolvedValue(conta),
  } satisfies ChefeDependentesApi
}

const anosAtras = (anos: number) => {
  const d = new Date()
  d.setFullYear(d.getFullYear() - anos)
  return d.toISOString().slice(0, 10)
}

async function preencherBase(nascimento: string, cpf = '41827365080') {
  fireEvent.change(await screen.findByLabelText('Nome'), { target: { value: 'Novo Dependente' } })
  fireEvent.change(screen.getByLabelText('Data de nascimento'), { target: { value: nascimento } })
  fireEvent.change(screen.getByLabelText('CPF'), { target: { value: cpf } })
  await waitFor(() => expect(screen.getByLabelText('Prec CP')).toHaveValue('12345678906'))
}

describe('DependenteFormPage (T31-FE3)', () => {
  it('menor: vigência determinada travada com a data sugerida e responsável obrigatório', async () => {
    const api = criarApi()
    render(<DependenteFormPage titularId={1} api={api} />)
    const nascimento = anosAtras(5)
    await preencherBase(nascimento)

    expect(screen.getByRole('checkbox', { name: 'Determinada' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Determinada' })).toBeDisabled()
    expect(screen.getByLabelText('Data final')).toHaveValue(vigenciaSugerida(nascimento))
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()

    fireEvent.click(screen.getByRole('radio', { name: 'Titular (Antonio Ferreira)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(api.criar).toHaveBeenCalled())
    expect(api.criar.mock.calls[0][1]).toMatchObject({ tipoVigencia: 'DETERMINADA', responsavel: { tipo: 'TITULAR' }, senha: null })
  })

  it('menor com responsável novo: pede nome e senha e avisa que a conta será criada', async () => {
    const api = criarApi({ situacao: 'NOVA', nome: null })
    render(<DependenteFormPage titularId={1} api={api} />)
    await preencherBase(anosAtras(5))

    fireEvent.click(screen.getByRole('radio', { name: 'Outra pessoa' }))
    fireEvent.change(screen.getByLabelText('CPF do responsável'), { target: { value: '52736481909' } })
    expect(await screen.findByText('Será criada uma conta de responsável legal, com login por este CPF.')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Nome do responsável'), { target: { value: 'Helena Costa' } })
    fireEvent.change(screen.getByLabelText('Senha'), { target: { value: 'Senha@123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(api.criar).toHaveBeenCalled())
    expect(api.criar.mock.calls[0][1].responsavel).toEqual({
      tipo: 'OUTRA_PESSOA', cpf: '52736481909', nome: 'Helena Costa', telefone: '',
    })
  })

  it('menor com responsável existente: "CPF encontrado" e nenhuma conta nova', async () => {
    render(<DependenteFormPage titularId={1} api={criarApi({ situacao: 'RESPONSAVEL_EXTERNO', nome: 'Helena Costa' })} />)
    await preencherBase(anosAtras(5))

    fireEvent.click(screen.getByRole('radio', { name: 'Outra pessoa' }))
    fireEvent.change(screen.getByLabelText('CPF do responsável'), { target: { value: '52736481909' } })

    expect(await screen.findByText('CPF encontrado: Helena Costa já tem conta. Nenhuma conta nova será criada.')).toBeInTheDocument()
    expect(screen.queryByLabelText('Senha')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar' })).toBeEnabled()
  })

  it('maior: Vitalícia marcada; com CPF de responsável externo, a conta é reaproveitada', async () => {
    render(<DependenteFormPage titularId={1} api={criarApi({ situacao: 'RESPONSAVEL_EXTERNO', nome: 'Helena Costa' })} />)
    await preencherBase(anosAtras(30))

    expect(screen.getByRole('radio', { name: 'Vitalícia (padrão)' })).toBeChecked()
    expect(screen.getByText('Maior de idade tem conta própria, com login pelo CPF.')).toBeInTheDocument()
    expect(
      await screen.findByText('Esta pessoa já é responsável legal; a conta será reaproveitada e passará a ser de dependente.'),
    ).toBeInTheDocument()
    expect(screen.queryByText(/Responsável legal \(obrigatório/)).not.toBeInTheDocument()
  })

  it('maior com CPF novo pede a senha da conta própria', async () => {
    const api = criarApi({ situacao: 'NOVA', nome: null })
    render(<DependenteFormPage titularId={1} api={api} />)
    await preencherBase(anosAtras(30))

    expect(screen.getByRole('button', { name: 'Salvar' })).toBeDisabled()
    fireEvent.change(await screen.findByLabelText('Senha'), { target: { value: 'Senha@123' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(api.criar).toHaveBeenCalled())
    expect(api.criar.mock.calls[0][1]).toMatchObject({ tipoVigencia: 'VITALICIA', responsavel: null, senha: 'Senha@123' })
  })

  it('editar: Prec CP e vigência editáveis; CPF, nascimento e responsável só leitura', async () => {
    const api = criarApi()
    render(<DependenteFormPage titularId={1} dependenteId={1} api={api} />)

    expect(await screen.findByRole('heading', { name: 'Editar dependente' })).toBeInTheDocument()
    await waitFor(() => expect(screen.getByLabelText('Nome')).toHaveValue('Miguel Ferreira'))
    expect(screen.getByText('CPF: 390.533.447-05')).toBeInTheDocument()
    expect(screen.queryByLabelText('CPF')).not.toBeInTheDocument()
    expect(screen.getByText('Antonio Ferreira')).toBeInTheDocument()
    expect(screen.queryByRole('radio', { name: 'Outra pessoa' })).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Prec CP'), { target: { value: '12345678909' } })
    fireEvent.change(screen.getByLabelText('Data final'), { target: { value: '2041-12-31' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    await waitFor(() => expect(api.editar).toHaveBeenCalled())
    expect(api.editar.mock.calls[0]).toEqual([
      1,
      { nome: 'Miguel Ferreira', telefone: '12999990000', precCp: '12345678909', vinculo: 'Filho',
        tipoVigencia: 'DETERMINADA', vigenciaFim: '2041-12-31' },
    ])
  })

  it('erro 422 do servidor aparece no campo', async () => {
    const api = criarApi()
    const { ApiError } = await import('../../shared/api/http')
    api.criar.mockRejectedValue(new ApiError(422, 'Dados invalidos', ['precCp: Prec CP ja cadastrado']))
    render(<DependenteFormPage titularId={1} api={api} />)
    await preencherBase(anosAtras(5))
    fireEvent.click(screen.getByRole('radio', { name: 'Titular (Antonio Ferreira)' }))
    fireEvent.click(screen.getByRole('button', { name: 'Salvar' }))

    expect(await screen.findByText('Prec CP ja cadastrado')).toBeInTheDocument()
  })
})
