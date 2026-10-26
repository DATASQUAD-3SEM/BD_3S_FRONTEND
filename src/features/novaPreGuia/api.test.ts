import { afterEach, describe, expect, it, vi } from 'vitest'

import { criarPreGuia } from './api'
import { buscarOcs } from './ocsApi'
import { formVazio } from './NovaPreGuiaPage/types'

/**
 * Testes das chamadas da Nova pre-guia do beneficiario: criacao (POST /pre-guias) e busca de OCS.
 */

afterEach(() => vi.unstubAllGlobals())

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
}

describe('criarPreGuia', () => {
  it('envia somente ocsId e arquivo, sem dados pessoais', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respostaJson({ id: 7, numero: '0007', status: 'PENDENTE', dataCriacao: '2026-09-27T10:00:00', ocsId: 1 }, 201),
    )
    vi.stubGlobal('fetch', fetchMock)

    const form = {
      ...formVazio,
      ocs: { id: 1, nome: 'Laboratorio Exemplo', contrato: 'EXEMPLO-001', tipo: 'OCS' },
      arquivo: new File(['x'], 'a.pdf', { type: 'application/pdf' }),
    }

    const criada = await criarPreGuia(form)

    const [url, init] = fetchMock.mock.calls[0]
    const enviado = init.body as FormData
    expect(url).toBe('/api/pre-guias')
    expect(enviado.get('ocsId')).toBe('1')
    expect(enviado.get('arquivo')).toBeInstanceOf(File)
    expect(enviado.get('cpf')).toBeNull()
    expect(enviado.get('precCp')).toBeNull()
    expect(criada.numero).toBe('0007')
  })
})

describe('buscarOcs', () => {
  it('usa o endpoint do beneficiario com o termo de busca', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respostaJson([]))
    vi.stubGlobal('fetch', fetchMock)

    await buscarOcs(' hosp ')

    expect(fetchMock.mock.calls[0][0]).toBe('/api/beneficiarios/me/ocs?busca=hosp')
  })

  it('sem termo, pede a lista inicial', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respostaJson([]))
    vi.stubGlobal('fetch', fetchMock)

    await buscarOcs('')

    expect(fetchMock.mock.calls[0][0]).toBe('/api/beneficiarios/me/ocs')
  })
})
