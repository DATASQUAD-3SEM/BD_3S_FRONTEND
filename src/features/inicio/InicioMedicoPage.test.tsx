import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import InicioMedicoPage, { type InicioMedicoApi } from './InicioMedicoPage'
import type { GuiaParaAssinar } from '../guiasParaAssinar/types'
import type { PreGuiaParaCorrigir } from '../medicoFusex/CorrigirPreGuias/types'

/** T35-FE2: Início do médico. */

const MEDICO = {
  nome: 'Carlos Eduardo Lima', patente: 'Capitao', cpf: '11144477735', precCp: '11122233344', crm: '123456-SP',
  assinaturaCadastrada: true,
}

const guia = (guiaId: number, pendencias: GuiaParaAssinar['pendencias']): GuiaParaAssinar => ({
  guiaId, numero: `20261200${guiaId}`, beneficiarioNome: 'Antonio Carlos Ferreira', pendencias,
})

function criarApi(guias: GuiaParaAssinar[] = [], preGuias: unknown[] = []): InicioMedicoApi {
  return {
    medico: vi.fn().mockResolvedValue(MEDICO),
    guiasParaAssinar: vi.fn().mockResolvedValue(guias),
    preGuiasParaCorrigir: vi.fn().mockResolvedValue(preGuias as PreGuiaParaCorrigir[]),
  }
}

const renderizar = (api: InicioMedicoApi) =>
  render(
    <MemoryRouter>
      <InicioMedicoPage api={api} />
    </MemoryRouter>,
  )

const cartao = (titulo: string) => screen.getByRole('listitem', { name: titulo })

describe('T35-FE2 · Início do médico', () => {
  it('saudação com patente e nome, CRM e a Guia que espera a assinatura do médico', async () => {
    renderizar(criarApi([guia(1, ['MEDICO', 'CHEFE']), guia(2, ['CHEFE'])]))

    expect(await screen.findByRole('heading', { name: 'Olá, Capitao Carlos Eduardo Lima' })).toBeInTheDocument()
    expect(screen.getByText('CRM 123456-SP')).toBeInTheDocument()
    expect(within(cartao('Guias para assinar')).getByTestId('quantidade')).toHaveTextContent('1')
    expect(within(cartao('Guias para assinar')).getByRole('link')).toHaveAttribute('href', '/medico/guias-para-assinar')
  })

  it('pré-guias devolvidas: o cartão leva a Corrigir pré-guias', async () => {
    renderizar(criarApi([], [{ id: 13 }, { id: 14 }]))

    await screen.findByRole('heading', { name: /Olá/ })
    expect(await within(cartao('Pré-guias para corrigir')).findByText('2')).toBeInTheDocument()
    expect(within(cartao('Pré-guias para corrigir')).getByRole('link')).toHaveAttribute('href', '/medico/corrigir-pre-guias')
  })

  it('sem pendências: "Nada pendente" nos dois cartões', async () => {
    renderizar(criarApi())

    expect(await screen.findAllByText('Nada pendente')).toHaveLength(2)
  })

  it('falha de uma das listas: só o cartão dela mostra o erro', async () => {
    const api = criarApi([guia(1, ['MEDICO'])])
    api.preGuiasParaCorrigir = vi.fn().mockRejectedValue(new Error('falhou'))
    renderizar(api)

    expect(await within(cartao('Pré-guias para corrigir')).findByText('Não foi possível carregar.')).toBeInTheDocument()
    expect(within(cartao('Guias para assinar')).getByTestId('quantidade')).toHaveTextContent('1')
  })

  it('atalhos para Nova pré-guia e Minhas informações', async () => {
    renderizar(criarApi())
    await screen.findByRole('heading', { name: /Olá/ })

    const atalhos = screen.getByRole('navigation')
    expect(within(atalhos).getByRole('link', { name: /Nova pré-guia/ })).toHaveAttribute('href', '/medico/nova-pre-guia')
    expect(within(atalhos).getByRole('link', { name: /Minhas informações/ })).toHaveAttribute('href', '/medico/minhas-informacoes')
  })
})
