import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import {
  MinhasInformacoesDependenteMaior,
  MinhasInformacoesResponsavel,
  relacaoComTitular,
  type MinhasInformacoesOutrosApi,
} from './MinhasInformacoesOutros'

/** T31-FE5: Minhas informações do responsável legal externo e do dependente maior. */

function api(extras: Partial<MinhasInformacoesOutrosApi> = {}): MinhasInformacoesOutrosApi {
  return {
    responsavel: vi.fn().mockResolvedValue({ nome: 'Helena Costa', cpf: '41282945067', temAssinatura: false }),
    menores: vi.fn().mockResolvedValue([
      { dependenteId: 2, nome: 'Sofia Ferreira', vinculo: 'Filha', precCp: '12345678903', idade: 9,
        vigenciaFim: '2039-05-14', titularNome: 'Antonio Ferreira' },
    ]),
    dependente: vi.fn().mockResolvedValue({
      nome: 'Carla Ferreira', precCp: '12345678901', vinculo: 'Cônjuge', vigenciaFim: null, vigente: true,
      titularNome: 'Antonio Ferreira', temAssinatura: true,
    }),
    salvarAssinatura: vi.fn().mockResolvedValue(undefined),
    ...extras,
  }
}

describe('Minhas informações do responsável legal (T31-FE5)', () => {
  it('mostra nome e CPF sem Prec CP, a assinatura e os menores que acompanha', async () => {
    render(
      <MemoryRouter>
        <MinhasInformacoesResponsavel api={api()} />
      </MemoryRouter>,
    )

    const dados = await screen.findByRole('region', { name: 'Dados pessoais' })
    expect(within(dados).getByText('Helena Costa')).toBeInTheDocument()
    expect(within(dados).getByText('412.829.450-67')).toBeInTheDocument()
    expect(within(dados).getByText(/não tem Prec CP/)).toBeInTheDocument()

    const sofia = screen.getByRole('article', { name: 'Menor Sofia Ferreira' })
    expect(within(sofia).getByText('filha de Antonio Ferreira')).toBeInTheDocument()
    expect(within(sofia).getByText('123456789-03')).toBeInTheDocument()
    expect(within(sofia).getByRole('link', { name: 'Criar pré-guia' })).toHaveAttribute('href', '/pre-guias/nova?paciente=2')
    expect(screen.getByRole('heading', { name: /Assinatura digital/i })).toBeInTheDocument()
  })

  it('sem menores vigentes, a lista diz que não há nenhum', async () => {
    render(
      <MemoryRouter>
        <MinhasInformacoesResponsavel api={api({ menores: vi.fn().mockResolvedValue([]) })} />
      </MemoryRouter>,
    )

    expect(await screen.findByText('Nenhum menor vigente sob a sua responsabilidade.')).toBeInTheDocument()
  })

  it('relação com o titular vem do vínculo', () => {
    expect(relacaoComTitular('Filho', 'Antonio')).toBe('filho de Antonio')
    expect(relacaoComTitular(null, 'Antonio')).toBe('dependente de Antonio')
  })
})

describe('Minhas informações do dependente maior (T31-FE5)', () => {
  it('mostra os próprios dados (só leitura) e a assinatura', async () => {
    render(<MinhasInformacoesDependenteMaior api={api()} />)

    const dados = await screen.findByRole('region', { name: 'Dados pessoais' })
    expect(within(dados).getByText('Carla Ferreira')).toBeInTheDocument()
    expect(within(dados).getByText('123456789-01')).toBeInTheDocument()
    expect(within(dados).getByText('Vitalícia')).toBeInTheDocument()
    expect(within(dados).getByText('Antonio Ferreira')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('erro ao carregar mostra a mensagem', async () => {
    render(<MinhasInformacoesDependenteMaior api={api({ dependente: vi.fn().mockRejectedValue(new Error('x')) })} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os seus dados.')
  })
})
