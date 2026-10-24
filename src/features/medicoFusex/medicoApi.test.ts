import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { alterarSenha, salvarAssinatura } from './medicoApi'

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
    const imagem = new Blob(['png'], { type: 'image/png' })

    await salvarAssinatura(imagem)

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/usuarios/me/assinatura')
    expect(init?.method).toBe('PUT')
    expect(init?.body).toBeInstanceOf(FormData)
    expect((init?.body as FormData).get('arquivo')).toBeInstanceOf(File)
  })
})

describe('alterarSenha', () => {
  it('envia POST /usuarios/me/senha com senhaAtual, novaSenha e confirmacao (contrato T13-BE1)', async () => {
    await alterarSenha('senha123', 'nova12345', 'nova12345')

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/usuarios/me/senha')
    expect(init?.method).toBe('POST')
    expect(JSON.parse(init!.body as string)).toEqual({
      senhaAtual: 'senha123',
      novaSenha: 'nova12345',
      confirmacao: 'nova12345',
    })
  })
})
