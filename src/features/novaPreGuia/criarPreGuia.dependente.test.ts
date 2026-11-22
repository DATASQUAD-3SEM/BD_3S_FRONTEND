import { afterEach, describe, expect, it, vi } from 'vitest'
import { criarPreGuia } from './api'
import { formVazio } from './NovaPreGuiaPage/types'

describe('criarPreGuia com paciente (T30-FE1)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('envia dependenteId no multipart quando o paciente é um menor', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1, numero: 'PG-1', status: 'PENDENTE', dataCriacao: '2026-11-21', ocsId: 2 }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const arquivo = new File(['x'], 'encaminhamento.pdf', { type: 'application/pdf' })

    await criarPreGuia({ ...formVazio, ocs: { id: 2, nome: 'OCS', contrato: 'C', tipo: 'OCS' }, arquivo, dependenteId: 7 })

    const corpo = fetchMock.mock.calls[0][1].body as FormData
    expect(corpo.get('dependenteId')).toBe('7')
    expect(corpo.get('ocsId')).toBe('2')
  })

  it('não envia dependenteId quando o paciente é o próprio titular', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ id: 1, numero: 'PG-1', status: 'PENDENTE', dataCriacao: '2026-11-21', ocsId: 2 }), {
        status: 201,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)
    const arquivo = new File(['x'], 'encaminhamento.pdf', { type: 'application/pdf' })

    await criarPreGuia({ ...formVazio, ocs: { id: 2, nome: 'OCS', contrato: 'C', tipo: 'OCS' }, arquivo, dependenteId: null })

    const corpo = fetchMock.mock.calls[0][1].body as FormData
    expect(corpo.has('dependenteId')).toBe(false)
  })
})
