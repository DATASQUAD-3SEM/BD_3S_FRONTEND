import { describe, it, expect, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import EspelhosRecebidosPage from './EspelhosRecebidosPage'
import { criarMockSetorFaturas } from './api.mock'
import { ApiError } from '../../shared/api/http'

/**
 * T24-FE1: tela "Espelhos Recebidos". A lista traz só espelhos enviados pela OCS (sem as Auditadas), do mais
 * recente para o mais antigo; os filtros de OCS e Situação são feitos na tela; o detalhe mostra as guias com
 * VALOR TOTAL que bate com o cartão e o controle de fluxo (Glosa / OCS só em fatura com glosa).
 */

const mockApi = () => criarMockSetorFaturas({ atrasoMs: 0 })
const renderizar = (api = mockApi()) => render(<EspelhosRecebidosPage api={api} />)

/** Titulos dos cartões na ordem exibida (cabeçalho é um botão). */
const titulosDosCartoes = () =>
  screen.getAllByRole('button').map((b) => b.textContent ?? '')

const cabecalhoDoCartao = (texto: RegExp) => screen.getByRole('button', { name: texto })

describe('T24-FE1 · Espelhos Recebidos', () => {
  it('lista só espelhos recebidos, do mais recente para o mais antigo, sem as Auditadas', async () => {
    renderizar()
    await screen.findByRole('button', { name: /Espelho nº 1/ })

    const titulos = titulosDosCartoes()
    expect(titulos).toHaveLength(6)
    expect(titulos[0]).toContain('Espelho nº 1')
    expect(titulos[1]).toContain('Fatura nº 001/2026')
    expect(titulos[2]).toContain('Fatura nº 002/2026')
    expect(titulos[3]).toContain('Fatura nº 003/2026')
    expect(titulos[4]).toContain('Fatura nº 004/2026')
    expect(titulos[5]).toContain('Fatura nº 005/2026')
    // a fatura Auditada (006/2026) não aparece nesta lista
    expect(titulos.some((t) => t.includes('006/2026'))).toBe(false)
  })

  it('cartão sem nº mostra "Espelho nº X"; com nº mostra "Fatura nº XXX/XXXX"', async () => {
    renderizar()
    await screen.findByRole('button', { name: /Espelho nº 1/ })

    expect(cabecalhoDoCartao(/Espelho nº 1/)).toBeInTheDocument()
    expect(cabecalhoDoCartao(/Fatura nº 001\/2026/)).toBeInTheDocument()
  })

  it('filtra por OCS e por situação na tela, sem chamar o servidor de novo', async () => {
    const usuario = userEvent.setup()
    const api = mockApi()
    const listar = vi.spyOn(api, 'listarEspelhosRecebidos')
    renderizar(api)
    await screen.findByRole('button', { name: /Espelho nº 1/ })
    expect(listar).toHaveBeenCalledTimes(1)

    // OCS = Hospital Exemplo: só 002/2026 e 003/2026
    await usuario.selectOptions(screen.getByLabelText('OCS'), 'Hospital Exemplo')
    expect(titulosDosCartoes().every((t) => t.includes('Hospital Exemplo'))).toBe(true)
    expect(titulosDosCartoes()).toHaveLength(2)

    // Situação = Protocolada: só 001/2026 (a OCS volta para Todas)
    await usuario.selectOptions(screen.getByLabelText('OCS'), '')
    await usuario.selectOptions(screen.getByLabelText('Situação'), 'Protocolada')
    expect(titulosDosCartoes()).toHaveLength(1)
    expect(titulosDosCartoes()[0]).toContain('Fatura nº 001/2026')

    // trocar filtro não chamou o servidor de novo
    expect(listar).toHaveBeenCalledTimes(1)
  })

  it('o detalhe mostra as linhas e o VALOR TOTAL, que bate com o do cartão', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await screen.findByRole('button', { name: /Fatura nº 001\/2026/ })

    await usuario.click(cabecalhoDoCartao(/Fatura nº 001\/2026/))
    await screen.findByText('VALOR TOTAL')

    // o valor total do cartão (R$ 710,00) e o VALOR TOTAL do detalhe coincidem
    expect(screen.getAllByText('R$ 710,00')).toHaveLength(2)
    expect(screen.getByText('VALOR TOTAL')).toBeInTheDocument()
    // linhas da guia
    expect(screen.getByText('202610678')).toBeInTheDocument()
    expect(screen.getByText('TC - Abdome superior')).toBeInTheDocument()
  })

  it('controle de fluxo: uma linha por etapa, com responsável e datas; Glosa / OCS só em fatura com glosa', async () => {
    const usuario = userEvent.setup()
    renderizar()
    await screen.findByRole('button', { name: /Fatura nº 003\/2026/ })

    // 003/2026 teve glosa: Protocolo, Lisura / Glosa e Glosa / OCS (em andamento)
    await usuario.click(cabecalhoDoCartao(/Fatura nº 003\/2026/))
    const fluxoComGlosa = await screen.findByText('Controle de fluxo da fatura')
    const fluxo = fluxoComGlosa.closest('.sf-fluxo') as HTMLElement
    expect(within(fluxo).getByText('Protocolo')).toBeInTheDocument()
    expect(within(fluxo).getByText('Lisura / Glosa')).toBeInTheDocument()
    expect(within(fluxo).getByText('Glosa / OCS')).toBeInTheDocument()
    expect(within(fluxo).getByText('Em andamento')).toBeInTheDocument()
    expect(within(fluxo).getByText('setor.faturas')).toBeInTheDocument()

    // 005/2026 (Em auditoria) não teve glosa: sem a linha Glosa / OCS
    await usuario.click(cabecalhoDoCartao(/Fatura nº 005\/2026/))
    const fluxoSemGlosa = await screen.findByText('Controle de fluxo da fatura')
    const fluxo2 = fluxoSemGlosa.closest('.sf-fluxo') as HTMLElement
    expect(within(fluxo2).getByText('Protocolo')).toBeInTheDocument()
    expect(within(fluxo2).getByText('Lisura / Glosa')).toBeInTheDocument()
    expect(within(fluxo2).getByText('Auditagem')).toBeInTheDocument()
    expect(within(fluxo2).queryByText('Glosa / OCS')).not.toBeInTheDocument()
  })

  it('estado de carregamento', async () => {
    const api = mockApi()
    vi.spyOn(api, 'listarEspelhosRecebidos').mockReturnValue(new Promise(() => {}))
    renderizar(api)
    expect(await screen.findByText('Carregando espelhos recebidos…')).toBeInTheDocument()
  })

  it('lista vazia mostra o aviso de filtro', async () => {
    const api = mockApi()
    vi.spyOn(api, 'listarEspelhosRecebidos').mockResolvedValue([])
    renderizar(api)
    expect(await screen.findByText('Nenhum espelho recebido com esses filtros.')).toBeInTheDocument()
  })

  it('erro ao carregar mostra a mensagem de erro', async () => {
    const api = mockApi()
    vi.spyOn(api, 'listarEspelhosRecebidos').mockRejectedValue(new ApiError(500, 'Falha'))
    renderizar(api)
    expect(await screen.findByText('Não foi possível carregar os espelhos recebidos.')).toBeInTheDocument()
  })
})
