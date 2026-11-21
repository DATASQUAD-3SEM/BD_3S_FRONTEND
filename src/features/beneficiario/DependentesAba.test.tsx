import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import DependentesAba, { type DependenteDoTitular } from './DependentesAba'

/** T31-FE4: Minhas informações › Dependentes do titular, só leitura, com "Criar pré-guia" nos menores dele. */

const lista: DependenteDoTitular[] = [
  { dependenteId: 1, nome: 'Miguel Ferreira', vinculo: 'Filho', precCp: '12345678902', idade: 6, tipo: 'MENOR_TITULAR',
    vigenciaFim: '2048-03-20', podeCriarPreGuia: true },
  { dependenteId: 2, nome: 'Sofia Ferreira', vinculo: 'Filha', precCp: '12345678903', idade: 9, tipo: 'MENOR_RESPONSAVEL',
    vigenciaFim: '2039-05-14', podeCriarPreGuia: false },
  { dependenteId: 3, nome: 'Carla Ferreira', vinculo: 'Cônjuge', precCp: '12345678901', idade: 41, tipo: 'MAIOR',
    vigenciaFim: null, podeCriarPreGuia: false },
]

function renderizar(carregar = vi.fn().mockResolvedValue(lista)) {
  return render(
    <MemoryRouter>
      <DependentesAba titularNome="Antonio Ferreira" carregar={carregar} />
    </MemoryRouter>,
  )
}

describe('DependentesAba (T31-FE4)', () => {
  it('mostra a frase e os cartões dos dependentes vigentes, sem botões de edição', async () => {
    renderizar()

    expect(
      screen.getByText('Seus dependentes, cadastrados pelo chefe do FUSEX. Para incluir ou alterar um dependente, procure o chefe do FUSEX.'),
    ).toBeInTheDocument()
    expect(await screen.findAllByRole('article')).toHaveLength(3)
    expect(screen.queryByRole('button', { name: 'Editar' })).not.toBeInTheDocument()
  })

  it('"Criar pré-guia" só no menor sob a guarda do titular, com o menor já escolhido', async () => {
    renderizar()

    const miguel = await screen.findByRole('article', { name: 'Dependente Miguel Ferreira' })
    expect(within(miguel).getByRole('link', { name: 'Criar pré-guia' })).toHaveAttribute('href', '/pre-guias/nova?paciente=1')
    expect(within(miguel).getByText('Antonio Ferreira (titular)')).toBeInTheDocument()

    const sofia = screen.getByRole('article', { name: 'Dependente Sofia Ferreira' })
    expect(within(sofia).queryByRole('link', { name: 'Criar pré-guia' })).not.toBeInTheDocument()

    const carla = screen.getByRole('article', { name: 'Dependente Carla Ferreira' })
    expect(within(carla).getByText('Maior de idade, com conta própria: cria as próprias pré-guias.')).toBeInTheDocument()
  })

  it('erro ao carregar mostra a mensagem', async () => {
    renderizar(vi.fn().mockRejectedValue(new Error('falhou')))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os dependentes.')
  })
})
