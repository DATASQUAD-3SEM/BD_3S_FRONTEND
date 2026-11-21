import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { formatarDataCurta } from '../setorFatura/formatadores'
import GlosasRecebidasPage, { type GlosaResumo, type GlosasApi } from './GlosasRecebidasPage'

const dentroDoPrazo: GlosaResumo = {
  id: 3,
  numeroFatura: '003/2026',
  dataEnvioOcs: '2099-11-10T09:00:00',
  prazoOcs: '2099-11-16T23:59:59',
  prazoVencido: false,
  valorInformado: 500,
  valorGlosa: -20,
  valorFinal: 520,
}

const vencida: GlosaResumo = {
  ...dentroDoPrazo,
  id: 4,
  numeroFatura: '004/2026',
  prazoOcs: '2000-01-05T23:59:59',
  prazoVencido: true,
}

function renderizar(api: GlosasApi) {
  return render(
    <MemoryRouter>
      <GlosasRecebidasPage api={api} />
    </MemoryRouter>,
  )
}

function apiCom(listar: GlosasApi['listar']): GlosasApi {
  return { listar }
}

describe('GlosasRecebidasPage (T27-FE1)', () => {
  it('cartão dentro do prazo mostra o selo de aguardando e a data-limite', async () => {
    renderizar(apiCom(vi.fn().mockResolvedValue([dentroDoPrazo])))

    expect(await screen.findByText('Fatura nº 003/2026')).toBeInTheDocument()
    expect(screen.getByText('Aguardando decisão')).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`Prazo: até ${formatarDataCurta(dentroDoPrazo.prazoOcs)}`))).toBeInTheDocument()
  })

  it('cartão com prazo vencido mostra o selo e o texto de vencimento', async () => {
    renderizar(apiCom(vi.fn().mockResolvedValue([vencida])))

    expect(await screen.findByText('Prazo vencido')).toBeInTheDocument()
    expect(screen.getByText(new RegExp(`Prazo vencido em ${formatarDataCurta(vencida.prazoOcs)}`))).toBeInTheDocument()
  })

  it('o cartão leva ao detalhe da glosa', async () => {
    renderizar(apiCom(vi.fn().mockResolvedValue([dentroDoPrazo])))

    expect(await screen.findByRole('link', { name: /Fatura nº 003\/2026/ })).toHaveAttribute('href', '/ocs/glosas/3')
  })

  it('lista vazia mostra a mensagem própria', async () => {
    renderizar(apiCom(vi.fn().mockResolvedValue([])))

    expect(await screen.findByText('Nenhuma glosa pendente de decisão.')).toBeInTheDocument()
  })

  it('erro ao carregar mostra a mensagem', async () => {
    renderizar(apiCom(vi.fn().mockRejectedValue(new Error('falhou'))))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as glosas.')
  })
})
