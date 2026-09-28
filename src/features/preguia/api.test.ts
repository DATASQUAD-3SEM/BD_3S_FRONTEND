import { afterEach, describe, expect, it, vi } from 'vitest'
import { criarPreGuia } from './api'
import { formVazio } from './NovaPreGuiaPage/types'

afterEach(() => vi.unstubAllGlobals())

describe('criarPreGuia', () => {
  it('envia cpf e precCp sem formatacao (so digitos) e sem procedimentoIds', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 1,
          status: 'PENDENTE',
          dataEmissao: '2026-09-27T10:00:00',
          encaminhamentoUrl: 'encaminhamentos/x.pdf',
          ocsId: 1,
        }),
        { status: 201, headers: { 'Content-Type': 'application/json' } },
      ),
    )
    vi.stubGlobal('fetch', fetchMock)

    await criarPreGuia({
      ...formVazio,
      beneficiario: {
        nome: 'Maria',
        idade: '30',
        precCp: '458.722.133-00',
        cpf: '123.456.789-00',
        telefone: '(12) 98765-4321',
      },
      ocsId: 1,
      arquivo: new File(['x'], 'a.pdf', { type: 'application/pdf' }),
    })

    const enviado = fetchMock.mock.calls[0][1].body as FormData
    expect(enviado.get('cpf')).toBe('12345678900')
    expect(enviado.get('precCp')).toBe('45872213300')
    expect(enviado.get('procedimentoIds')).toBeNull()
  })
})
