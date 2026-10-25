import { afterEach, describe, expect, it, vi } from 'vitest'
import { minhasPreGuiasApi } from './api'

/**
 * Testes do cliente de Minhas pre-guias: as chamadas passam pelo cliente unico (prefixo /api e header de login).
 */

afterEach(() => {
  vi.unstubAllGlobals()
  localStorage.clear()
})

describe('minhasPreGuiasApi', () => {
  it('lista as pre-guias com o prefixo /api e o login simulado', async () => {
    localStorage.setItem('X-Usuario-Login', '52998224725')
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    await minhasPreGuiasApi.listar()

    const [url, init] = fetchMock.mock.calls[0]
    expect(url).toBe('/api/beneficiarios/me/pre-guias')
    expect(new Headers(init.headers).get('X-Usuario-Login')).toBe('52998224725')
  })

  it('baixa o PDF da Guia no modo pedido', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(new Blob(['%PDF']), { status: 200 }))
    vi.stubGlobal('fetch', fetchMock)

    const pdf = await minhasPreGuiasApi.obterPdf(2, 'baixar')

    expect(fetchMock.mock.calls[0][0]).toBe('/api/beneficiarios/me/pre-guias/2/guia/pdf?modo=baixar')
    expect(pdf).toBeInstanceOf(Blob)
  })

  it('erro do backend vira ApiError com a mensagem do servidor', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ status: 403, mensagem: 'Pre-guia ainda nao esta concluida', detalhes: [] }), {
          status: 403,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )

    await expect(minhasPreGuiasApi.obterPdf(3, 'visualizar')).rejects.toThrow('Pre-guia ainda nao esta concluida')
  })
})
