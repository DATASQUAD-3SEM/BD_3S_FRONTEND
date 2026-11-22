import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { formatarDataCurta } from '../setorFatura/formatadores'
import FaturasRecebidasPage from './FaturasRecebidasPage'
import type { FaturaLisuraResumo, RastreabilidadeApi } from './types'

const base: FaturaLisuraResumo = {
  id: 1,
  ocs: 'Laboratorio Exemplo',
  dataInicio: '2026-10-03T00:00:00',
  dataEnvio: '2026-11-02T09:00:00',
  dataEntrada: '2026-11-02T09:00:00',
  numeroFatura: '007/2026',
  situacao: 'EM_LISURA',
  valorInformado: 1000,
  linhasDecididas: 1,
  totalLinhas: 3,
  dataEnvioOcs: null,
  prazoOcs: null,
  liberadaParaAuditoria: false,
}

const emLisura = base
const aguardandoOcs: FaturaLisuraResumo = {
  ...base,
  id: 2,
  ocs: 'Clinica Outra',
  numeroFatura: '008/2026',
  situacao: 'AGUARDANDO_OCS',
  dataEnvioOcs: '2026-11-10T10:00:00',
  liberadaParaAuditoria: true,
}

function apiCom(listarFaturas: RastreabilidadeApi['listarFaturas']): RastreabilidadeApi {
  return { listarFaturas }
}

function renderizar(api: RastreabilidadeApi) {
  return render(
    <MemoryRouter>
      <FaturasRecebidasPage api={api} />
    </MemoryRouter>,
  )
}

describe('FaturasRecebidasPage (T25-FE-1)', () => {
  it('mostra o resumo de lisura e de aguardando a OCS, com a liberação para auditoria', async () => {
    renderizar(apiCom(vi.fn().mockResolvedValue([emLisura, aguardandoOcs])))

    expect(await screen.findByText('Fatura nº 007/2026 · Laboratorio Exemplo')).toBeInTheDocument()
    expect(screen.getByText(/Linhas decididas: 1 de 3/)).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`Glosas enviadas à OCS em ${formatarDataCurta(aguardandoOcs.dataEnvioOcs)}`)),
    ).toBeInTheDocument()
    expect(screen.getByText(/Liberada para a auditoria/)).toBeInTheDocument()
  })

  it('filtra por OCS na tela', async () => {
    const user = userEvent.setup()
    renderizar(apiCom(vi.fn().mockResolvedValue([emLisura, aguardandoOcs])))
    await screen.findByText('Fatura nº 007/2026 · Laboratorio Exemplo')

    await user.selectOptions(screen.getByLabelText('OCS'), 'Clinica Outra')

    expect(screen.queryByText('Fatura nº 007/2026 · Laboratorio Exemplo')).not.toBeInTheDocument()
    expect(screen.getByText('Fatura nº 008/2026 · Clinica Outra')).toBeInTheDocument()
  })

  it('o cartão leva à lisura da fatura', async () => {
    renderizar(apiCom(vi.fn().mockResolvedValue([emLisura])))

    const link = await screen.findByRole('link', { name: /Fatura nº 007\/2026/ })
    expect(link).toHaveAttribute('href', '/rastreabilidade/faturas/1')
  })

  it('mostra a mensagem de lista vazia', async () => {
    renderizar(apiCom(vi.fn().mockResolvedValue([])))

    expect(await screen.findByText('Nenhuma fatura aguardando lisura.')).toBeInTheDocument()
  })

  it('mostra erro quando a lista não carrega', async () => {
    renderizar(apiCom(vi.fn().mockRejectedValue(new Error('falhou'))))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as faturas.')
  })

  it('o filtro de OCS lista só as OCS presentes, em ordem alfabética', async () => {
    renderizar(apiCom(vi.fn().mockResolvedValue([emLisura, aguardandoOcs])))
    await screen.findByText('Fatura nº 007/2026 · Laboratorio Exemplo')

    const opcoes = within(screen.getByLabelText('OCS')).getAllByRole('option').map((o) => o.textContent)
    expect(opcoes).toEqual(['Todas as OCS', 'Clinica Outra', 'Laboratorio Exemplo'])
  })
})
