import { afterEach, describe, expect, it, vi } from 'vitest'
import { guiasRecepcaoApi } from './api'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('guiasRecepcaoApi', () => {
  it('buscar chama GET /api/recepcao/guias com o termo codificado', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await guiasRecepcaoApi.buscar('Antonio Carlos')

    expect(fetchMock.mock.calls[0][0]).toBe('/api/recepcao/guias?busca=Antonio%20Carlos')
  })

  it('obterPdf chama o endpoint com o modo e devolve o conteudo', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('%PDF-1.4', { status: 200, headers: { 'Content-Type': 'application/pdf' } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const pdf = await guiasRecepcaoApi.obterPdf(7, 'imprimir')

    expect(fetchMock.mock.calls[0][0]).toBe('/api/recepcao/guias/7/pdf?modo=imprimir')
    expect(pdf.size).toBeGreaterThan(0)
  })
})
