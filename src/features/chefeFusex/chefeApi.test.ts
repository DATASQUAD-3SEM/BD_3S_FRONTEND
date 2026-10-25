import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { salvarAssinatura, salvarDadosChefe } from './chefeApi'

/**
 * Testes das chamadas a API da conta do Chefe.
 */

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ nome: 'Chefe do FUSEX', patente: 'Coronel', login: 'chefe.fusex', assinaturaCadastrada: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('salvarDadosChefe', () => {
  it('envia PUT /chefe/me em JSON, com valores sem espaços extras e novaSenha null quando vazia', async () => {
    await salvarDadosChefe({ nome: ' Chefe do FUSEX ', patente: 'Coronel', login: 'chefe.fusex', novaSenha: '' })

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/chefe/me')
    expect(init?.method).toBe('PUT')
    expect(JSON.parse(init!.body as string)).toEqual({
      nome: 'Chefe do FUSEX',
      patente: 'Coronel',
      login: 'chefe.fusex',
      novaSenha: null,
    })
  })

  it('envia a nova senha quando ela foi preenchida', async () => {
    await salvarDadosChefe({ nome: 'Chefe', patente: 'Coronel', login: 'chefe.fusex', novaSenha: 'nova12345' })

    expect(JSON.parse(vi.mocked(fetch).mock.calls[0][1]!.body as string).novaSenha).toBe('nova12345')
  })
})

describe('salvarAssinatura', () => {
  it('envia a imagem como PUT multipart no campo "arquivo" (contrato T13-BE2)', async () => {
    await salvarAssinatura(new Blob(['png'], { type: 'image/png' }))

    const [url, init] = vi.mocked(fetch).mock.calls[0]
    expect(url).toBe('/api/usuarios/me/assinatura')
    expect(init?.method).toBe('PUT')
    expect((init?.body as FormData).get('arquivo')).toBeInstanceOf(File)
  })
})

describe('login simulado acompanha a troca de login do chefe', () => {
  function stubRespostaPerfil(login: string) {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ nome: 'Chefe', patente: 'Coronel', login, assinaturaCadastrada: false }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }),
      ),
    )
  }

  afterEach(() => localStorage.removeItem('X-Usuario-Login'))

  it('troca o login guardado quando ele era o login anterior do chefe', async () => {
    localStorage.setItem('X-Usuario-Login', 'chefe.fusex')
    stubRespostaPerfil('chefe.novo')

    await salvarDadosChefe({ nome: 'Chefe', patente: 'Coronel', login: 'chefe.novo', novaSenha: '' }, 'chefe.fusex')

    expect(localStorage.getItem('X-Usuario-Login')).toBe('chefe.novo')
  })

  it('não mexe no login guardado quando ele pertence a outra conta', async () => {
    localStorage.setItem('X-Usuario-Login', '52998224725')
    stubRespostaPerfil('chefe.novo')

    await salvarDadosChefe({ nome: 'Chefe', patente: 'Coronel', login: 'chefe.novo', novaSenha: '' }, 'chefe.fusex')

    expect(localStorage.getItem('X-Usuario-Login')).toBe('52998224725')
  })
})
