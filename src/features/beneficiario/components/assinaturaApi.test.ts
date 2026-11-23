import { afterEach, describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api/http'
import { buscarAssinaturaAtual } from './assinaturaApi'

/** T37-BE3: GET /usuarios/me/assinatura devolve a imagem; 404 (ainda sem assinatura) vira null. */

afterEach(() => vi.unstubAllGlobals())

function erroJson(status: number, mensagem: string): Response {
  return new Response(JSON.stringify({ status, erro: 'Erro', mensagem, detalhes: [], timestamp: '' }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

describe('buscarAssinaturaAtual', () => {
  it('chama GET /api/usuarios/me/assinatura com o login e devolve a imagem', async () => {
    localStorage.setItem('X-Usuario-Login', 'beneficiario.teste')
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(new Uint8Array([137, 80, 78, 71]), { status: 200, headers: { 'Content-Type': 'image/png' } }),
    )
    vi.stubGlobal('fetch', fetchMock)

    const imagem = await buscarAssinaturaAtual()

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
    expect(url).toBe('/api/usuarios/me/assinatura')
    expect(new Headers(init.headers).get('X-Usuario-Login')).toBe('beneficiario.teste')
    expect(imagem?.type).toBe('image/png')
    expect(imagem?.size).toBe(4)
    localStorage.removeItem('X-Usuario-Login')
  })

  it('devolve null quando a pessoa ainda não tem assinatura (404)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(erroJson(404, 'Assinatura não cadastrada.')))

    await expect(buscarAssinaturaAtual()).resolves.toBeNull()
  })

  it('repassa os outros erros, como o 403 das contas de setor', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(erroJson(403, 'Este perfil nao tem assinatura')))

    await expect(buscarAssinaturaAtual()).rejects.toBeInstanceOf(ApiError)
  })
})
