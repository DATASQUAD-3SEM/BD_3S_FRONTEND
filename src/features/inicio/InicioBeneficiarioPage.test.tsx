import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import InicioBeneficiarioPage, { contarPendencias, primeiroNome } from './InicioBeneficiarioPage'
import type { InicioApi, PessoaInicio } from './inicioApi'
import type { GuiaDoBeneficiario } from '../minhasGuias/types'
import type { PreGuiaDoBeneficiario } from '../minhasPreGuias/types'

/** T35-FE1: Início do titular, do dependente maior e do responsável legal. */

const preGuia = (id: number, status: PreGuiaDoBeneficiario['status']) =>
  ({ id, numero: `00${id}`, ocsNome: 'Laboratorio Exemplo', origem: 'BENEFICIARIO', dataCriacao: '2026-11-20T10:00:00', status }) as PreGuiaDoBeneficiario

const guia = (id: number, situacao: GuiaDoBeneficiario['situacao'], solicitadas = 0) =>
  ({
    id,
    numero: `20261200${id}`,
    situacao,
    sessoes: Array.from({ length: solicitadas }, (_, i) => ({
      id: id * 10 + i, procedimento: '40304361', numero: i + 1, status: 'SOLICITADA', dataSolicitacao: null, dataAssinatura: null,
    })),
  }) as unknown as GuiaDoBeneficiario

function criarApi(pessoa: PessoaInicio, preGuias: PreGuiaDoBeneficiario[] = [], guias: GuiaDoBeneficiario[] = []): InicioApi {
  return {
    pessoa: vi.fn().mockResolvedValue(pessoa),
    preGuias: vi.fn().mockResolvedValue(preGuias),
    guias: vi.fn().mockResolvedValue(guias),
  }
}

const TITULAR: PessoaInicio = { tipo: 'TITULAR', nome: 'Antonio Carlos Ferreira', temAssinatura: true }

const renderizar = (api: InicioApi) =>
  render(
    <MemoryRouter>
      <InicioBeneficiarioPage api={api} />
    </MemoryRouter>,
  )

const cartao = (titulo: string) => screen.getByRole('listitem', { name: titulo })

describe('T35-FE1 · Início do beneficiário', () => {
  it('titular com uma pré-guia em Atenção e uma Guia Não enviada: cartões com 1 e botões para as telas certas', async () => {
    renderizar(criarApi(TITULAR, [preGuia(1, 'ATENCAO'), preGuia(2, 'CONCLUIDA')], [guia(1, 'NAO_ENVIADA'), guia(2, 'REALIZADA')]))

    expect(await screen.findByRole('heading', { name: 'Olá, Antonio' })).toBeInTheDocument()
    expect(
      screen.getByText('Aqui você acompanha as suas pré-guias e guias e as dos seus dependentes menores.'),
    ).toBeInTheDocument()
    expect(within(cartao('Precisam de correção')).getByTestId('quantidade')).toHaveTextContent('1')
    expect(within(cartao('Precisam de correção')).getByRole('link')).toHaveAttribute('href', '/pre-guias')
    expect(within(cartao('Prontas para enviar à OCS')).getByTestId('quantidade')).toHaveTextContent('1')
    expect(within(cartao('Prontas para enviar à OCS')).getByRole('link')).toHaveAttribute('href', '/guias')
  })

  it('tudo zerado: os quatro cartões mostram "Nada pendente"', async () => {
    renderizar(criarApi(TITULAR))
    await screen.findByRole('heading', { name: 'Olá, Antonio' })

    expect(await screen.findAllByText('Nada pendente')).toHaveLength(4)
  })

  it('responsável legal: saudação com o nome dele e a frase de responsável', async () => {
    renderizar(criarApi({ tipo: 'RESPONSAVEL', nome: 'Helena Costa', temAssinatura: true }))

    expect(await screen.findByRole('heading', { name: 'Olá, Helena' })).toBeInTheDocument()
    expect(
      screen.getByText('Aqui você acompanha as pré-guias e guias dos menores que você acompanha como responsável legal.'),
    ).toBeInTheDocument()
  })

  it('dependente maior: frase só com as próprias pré-guias e guias', async () => {
    renderizar(criarApi({ tipo: 'DEPENDENTE_MAIOR', nome: 'Carla Ferreira', temAssinatura: true }))

    expect(await screen.findByText('Aqui você acompanha as suas pré-guias e guias.')).toBeInTheDocument()
  })

  it('sessões solicitadas sem assinatura cadastrada: aviso com o botão "Cadastrar assinatura"', async () => {
    renderizar(criarApi({ ...TITULAR, temAssinatura: false }, [], [guia(1, 'EM_EXECUCAO', 2)]))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Você tem sessões para assinar, mas ainda não cadastrou a sua assinatura. Cadastre em Minhas informações.',
    )
    expect(screen.getByRole('link', { name: 'Cadastrar assinatura' })).toHaveAttribute('href', '/beneficiario/minhas-informacoes')
    expect(within(cartao('Sessões para assinar')).getByTestId('quantidade')).toHaveTextContent('2')
  })

  it('falha de uma das listas: só os cartões dela mostram o erro', async () => {
    const api = criarApi(TITULAR, [preGuia(1, 'PENDENTE')])
    api.guias = vi.fn().mockRejectedValue(new Error('falhou'))
    renderizar(api)

    expect(await screen.findAllByText('Não foi possível carregar.')).toHaveLength(2)
    expect(within(cartao('Com o setor de Guias')).getByTestId('quantidade')).toHaveTextContent('1')
  })

  it('funções auxiliares: primeiro nome e contagem das pendências', () => {
    expect(primeiroNome('  Antonio Carlos Ferreira ')).toBe('Antonio')
    expect(contarPendencias([preGuia(1, 'PENDENTE'), preGuia(2, 'EM_ANALISE')], [guia(1, 'EM_EXECUCAO', 3)])).toEqual({
      atencao: 0, comSetor: 2, naoEnviadas: 0, sessoesParaAssinar: 3,
    })
    expect(contarPendencias(null, null).atencao).toBeNull()
  })
})
