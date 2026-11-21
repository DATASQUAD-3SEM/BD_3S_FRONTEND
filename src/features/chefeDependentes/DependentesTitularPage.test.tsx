import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'
import DependentesTitularPage from './DependentesTitularPage'
import type { ChefeDependentesApi, DependenteItem, DependentesDoTitular } from './tipos'

/** T31-FE2: dependentes do titular na visão do chefe. */

const base: Omit<DependenteItem, 'dependenteId' | 'nome' | 'tipo'> = {
  vinculo: 'Filho', precCp: '12345678902', dataNascimento: '2020-03-21', idade: 6,
  vigenciaFim: '2042-03-20', vigenciaVencida: false, temConta: false, responsaveis: [],
}

const dados: DependentesDoTitular = {
  titularId: 1,
  titularNome: 'Antonio Ferreira',
  dependentes: [
    { ...base, dependenteId: 4, nome: 'Rita Ferreira', tipo: 'MAIOR', vinculo: 'Filha', vigenciaFim: '2025-01-19',
      vigenciaVencida: true, temConta: true },
    { ...base, dependenteId: 1, nome: 'Miguel Ferreira', tipo: 'MENOR_TITULAR',
      responsaveis: [{ usuarioId: 1, nome: 'Antonio Ferreira', papel: 'TITULAR' }] },
    { ...base, dependenteId: 2, nome: 'Sofia Ferreira', tipo: 'MENOR_RESPONSAVEL', vinculo: 'Filha',
      responsaveis: [{ usuarioId: 41, nome: 'Helena Costa', papel: 'EXTERNO' }] },
    { ...base, dependenteId: 3, nome: 'Carla Ferreira', tipo: 'MAIOR', vinculo: 'Cônjuge', vigenciaFim: null, temConta: true },
  ],
}

function api(listar = vi.fn().mockResolvedValue(dados)): ChefeDependentesApi {
  return { listar, criar: vi.fn(), editar: vi.fn(), proximoPrecCp: vi.fn(), consultarConta: vi.fn() }
}

describe('DependentesTitularPage (T31-FE2)', () => {
  it('mostra trilha, título, frase e um cartão por dependente com o vencido no fim', async () => {
    render(<DependentesTitularPage titularId={1} api={api()} />)

    expect(await screen.findByRole('heading', { name: 'Dependentes de Antonio Ferreira' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Trilha' })).toHaveTextContent('Beneficiários › Antonio Ferreira › Dependentes')
    expect(screen.getByText('Todo dependente pertence a um titular. O chefe do FUSEX cadastra e mantém os dependentes.'))
      .toBeInTheDocument()
    const cartoes = screen.getAllByRole('article')
    expect(cartoes.map((c) => c.getAttribute('aria-label'))).toEqual([
      'Dependente Miguel Ferreira', 'Dependente Sofia Ferreira', 'Dependente Carla Ferreira', 'Dependente Rita Ferreira',
    ])
    expect(within(cartoes[3]).getByText('Vigência vencida em 19/01/2025')).toBeInTheDocument()
    expect(within(cartoes[3]).getByRole('button', { name: 'Editar' })).toBeInTheDocument()
  })

  it('cada caso mostra o selo, a conta e o responsável certos', async () => {
    render(<DependentesTitularPage titularId={1} api={api()} />)

    const miguel = await screen.findByRole('article', { name: 'Dependente Miguel Ferreira' })
    expect(within(miguel).getByText('Menor · guarda do titular')).toBeInTheDocument()
    expect(within(miguel).getByText('Sem conta (acesso pelo responsável)')).toBeInTheDocument()
    expect(within(miguel).getByText('Antonio Ferreira (titular)')).toBeInTheDocument()

    const sofia = screen.getByRole('article', { name: 'Dependente Sofia Ferreira' })
    expect(within(sofia).getByText('Menor · responsável legal')).toBeInTheDocument()
    expect(within(sofia).getByText('Helena Costa (responsável externo)')).toBeInTheDocument()

    const carla = screen.getByRole('article', { name: 'Dependente Carla Ferreira' })
    expect(within(carla).getByText('Maior de idade')).toBeInTheDocument()
    expect(within(carla).getByText('Vitalícia')).toBeInTheDocument()
    expect(within(carla).getByText('Conta própria (login pelo CPF)')).toBeInTheDocument()
    expect(within(carla).queryByText('Responsável legal')).not.toBeInTheDocument()
  })

  it('"Editar" e "+ Adicionar dependente" chamam as ações; não há remover nem encerrar', async () => {
    const user = userEvent.setup()
    const onEditar = vi.fn()
    const onAdicionar = vi.fn()
    render(<DependentesTitularPage titularId={1} api={api()} onEditar={onEditar} onAdicionar={onAdicionar} />)

    const sofia = await screen.findByRole('article', { name: 'Dependente Sofia Ferreira' })
    await user.click(within(sofia).getByRole('button', { name: 'Editar' }))
    await user.click(screen.getByRole('button', { name: '+ Adicionar dependente' }))

    expect(onEditar).toHaveBeenCalledWith(2)
    expect(onAdicionar).toHaveBeenCalled()
    expect(screen.queryByRole('button', { name: /Remover|Encerrar/ })).not.toBeInTheDocument()
  })

  it('titular sem dependentes mostra a mensagem e o botão de adicionar', async () => {
    render(<DependentesTitularPage titularId={1} api={api(vi.fn().mockResolvedValue({ ...dados, dependentes: [] }))} />)

    expect(await screen.findByText('Nenhum dependente atribuído a este beneficiário.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '+ Adicionar dependente' })).toBeInTheDocument()
  })

  it('erro ao carregar mostra a mensagem', async () => {
    render(<DependentesTitularPage titularId={1} api={api(vi.fn().mockRejectedValue(new Error('falhou')))} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os dependentes.')
  })
})
