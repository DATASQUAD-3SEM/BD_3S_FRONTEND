import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { salvarAssinatura } from './beneficiarioApi'

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ assinaturaCadastrada: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('salvarAssinatura', () => {
  it('envia a imagem como PUT multipart no campo "arquivo" (contrato T13-BE2)', async () => {
    await salvarAssinatura(new Blob(['png'], { type: 'image/png' }))

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/usuarios/me/assinatura')
    expect(init?.method).toBe('PUT')
    expect((init?.body as FormData).get('arquivo')).toBeInstanceOf(File)
    expect((init?.body as FormData).has('imagem')).toBe(false)
  })
})
