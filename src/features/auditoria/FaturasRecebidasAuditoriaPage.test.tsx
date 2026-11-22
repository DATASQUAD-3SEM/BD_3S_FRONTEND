import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import { formatarDataCurta } from '../setorFatura/formatadores'
import FaturasRecebidasAuditoriaPage from './FaturasRecebidasAuditoriaPage'
import type { AuditoriaApi, FaturaAuditoriaResumo } from './types'

const fatura: FaturaAuditoriaResumo = {
  id: 1,
  ocs: 'Laboratorio Exemplo',
  numeroFatura: '007/2026',
  dataEntrada: '2026-11-02T09:00:00',
  dataInicio: '2026-10-03T00:00:00',
  dataEnvio: '2026-11-02T09:00:00',
  dataRecebimentoAuditoria: '2026-11-12T10:00:00',
  situacao: 'EM_AUDITORIA',
  valorInformado: 1000,
  valorGlosa: 120,
  valorFinal: 880,
}

const outra: FaturaAuditoriaResumo = {
  ...fatura,
  id: 2,
  ocs: 'Clinica Outra',
  numeroFatura: '008/2026',
  valorGlosa: null,
  valorFinal: 1000,
}

function apiCom(listarFaturas: AuditoriaApi['listarFaturas']): AuditoriaApi {
  return { listarFaturas, detalhar: vi.fn(), obterPdfGuia: vi.fn() }
}

function renderizar(api: AuditoriaApi) {
  return render(
    <MemoryRouter>
      <FaturasRecebidasAuditoriaPage api={api} />
    </MemoryRouter>,
  )
}

describe('FaturasRecebidasAuditoriaPage (T26-FE1)', () => {
  it('mostra o cartão com número, OCS, data de recebimento e valores', async () => {
    renderizar(apiCom(vi.fn().mockResolvedValue([fatura])))

    expect(await screen.findByText('Fatura nº 007/2026 · Laboratorio Exemplo')).toBeInTheDocument()
    expect(
      screen.getByText(new RegExp(`Recebida em ${formatarDataCurta(fatura.dataRecebimentoAuditoria)}`)),
    ).toBeInTheDocument()
  })

  it('filtra por OCS na tela', async () => {
    const user = userEvent.setup()
    renderizar(apiCom(vi.fn().mockResolvedValue([fatura, outra])))
    await screen.findByText('Fatura nº 007/2026 · Laboratorio Exemplo')

    await user.selectOptions(screen.getByLabelText('OCS'), 'Clinica Outra')

    expect(screen.queryByText('Fatura nº 007/2026 · Laboratorio Exemplo')).not.toBeInTheDocument()
    expect(screen.getByText('Fatura nº 008/2026 · Clinica Outra')).toBeInTheDocument()
  })

  it('o cartão leva à visualização da fatura', async () => {
    renderizar(apiCom(vi.fn().mockResolvedValue([fatura])))

    expect(await screen.findByRole('link', { name: /Fatura nº 007\/2026/ })).toHaveAttribute(
      'href',
      '/auditoria/faturas/1',
    )
  })

  it('lista vazia mostra a mensagem própria', async () => {
    renderizar(apiCom(vi.fn().mockResolvedValue([])))

    expect(await screen.findByText('Nenhuma fatura aguardando visualização.')).toBeInTheDocument()
  })

  it('erro ao carregar mostra a mensagem', async () => {
    renderizar(apiCom(vi.fn().mockRejectedValue(new Error('falhou'))))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as faturas.')
  })

  it('a lista de OCS vem em ordem alfabética, sem repetição', async () => {
    renderizar(apiCom(vi.fn().mockResolvedValue([outra, fatura, { ...fatura, id: 3 }])))
    await screen.findAllByText(/Fatura nº/)

    const opcoes = within(screen.getByLabelText('OCS')).getAllByRole('option').map((o) => o.textContent)
    expect(opcoes).toEqual(['Todas as OCS', 'Clinica Outra', 'Laboratorio Exemplo'])
  })
})
