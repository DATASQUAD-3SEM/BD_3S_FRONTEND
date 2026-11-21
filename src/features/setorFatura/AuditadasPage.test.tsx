import { render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import AuditadasPage from './AuditadasPage'
import type { FaturaAuditada, SetorFaturasApi } from './types'

const auditada: FaturaAuditada = {
  id: 6,
  ocs: 'Laboratorio Exemplo',
  dataInicio: '2026-09-01T00:00:00',
  dataEnvio: '2026-09-30T09:00:00',
  numeroFatura: '006/2026',
  dataEntrada: '2026-09-30T09:00:00',
  dataVisualizacao: '2026-10-05T10:00:00',
  valorInformado: 1000,
  valorGlosa: 120,
  valorFinal: 880,
}

function apiComLista(listarAuditadas: SetorFaturasApi['listarAuditadas']): SetorFaturasApi {
  return {
    listarAuditadas,
    listarEspelhosRecebidos: vi.fn(),
    detalharEspelho: vi.fn(),
    proximoNumeroFatura: vi.fn(),
    protocolarFatura: vi.fn(),
    enviarParaLisura: vi.fn(),
  } as unknown as SetorFaturasApi
}

describe('AuditadasPage (T24-FE4)', () => {
  it('lista as faturas auditadas com número, valores e data de visualização', async () => {
    render(<AuditadasPage api={apiComLista(vi.fn().mockResolvedValue([auditada]))} />)

    expect(await screen.findByRole('table')).toBeInTheDocument()
    expect(screen.getByText('006/2026')).toBeInTheDocument()
    expect(screen.getByText('Laboratorio Exemplo')).toBeInTheDocument()
    expect(screen.getByText(/10\/05\/2026|05\/10\/2026/)).toBeInTheDocument()
  })

  it('mostra mensagem quando não há faturas auditadas', async () => {
    render(<AuditadasPage api={apiComLista(vi.fn().mockResolvedValue([]))} />)

    expect(await screen.findByText('Nenhuma fatura auditada ainda.')).toBeInTheDocument()
  })

  it('mostra erro quando a lista não carrega', async () => {
    render(<AuditadasPage api={apiComLista(vi.fn().mockRejectedValue(new Error('falhou')))} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as faturas auditadas.')
  })
})
