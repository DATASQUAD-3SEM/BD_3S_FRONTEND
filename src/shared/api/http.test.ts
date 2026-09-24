import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError, get, postForm } from './http'

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
}

afterEach(() => vi.unstubAllGlobals())

describe('http', () => {
  it('prefixa /api e devolve o JSON', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respostaJson({ status: 'UP' }))
    vi.stubGlobal('fetch', fetchMock)

    const dados = await get<{ status: string }>('/actuator/health')

    expect(fetchMock).toHaveBeenCalledWith('/api/actuator/health', {})
    expect(dados.status).toBe('UP')
  })

  it('converte o ErrorResponse do backend em ApiError', async () => {
    const erro = { status: 404, erro: 'Not Found', mensagem: 'OCS nao encontrada', detalhes: [], timestamp: 'x' }
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson(erro, 404)))

    await expect(get('/ocs/99')).rejects.toMatchObject({ status: 404, message: 'OCS nao encontrada', semResposta: false })
  })

  it('marca semResposta quando o fetch falha (backend/rede fora)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    const erro = await get('/ocs').catch((e: unknown) => e)

    expect(erro).toBeInstanceOf(ApiError)
    expect((erro as ApiError).semResposta).toBe(true)
  })

  it('marca semResposta quando o proxy devolve 500 em texto puro', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('ECONNREFUSED', { status: 500 })))

    const erro = (await get('/ocs').catch((e: unknown) => e)) as ApiError

    expect(erro.semResposta).toBe(true)
  })

  it('postForm envia FormData sem Content-Type manual', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respostaJson({ id: 1 }))
    vi.stubGlobal('fetch', fetchMock)
    const dados = new FormData()
    dados.append('ocsId', '1')

    await postForm('/pre-guias', dados)

    expect(fetchMock).toHaveBeenCalledWith('/api/pre-guias', { method: 'POST', body: dados })
  })
})
