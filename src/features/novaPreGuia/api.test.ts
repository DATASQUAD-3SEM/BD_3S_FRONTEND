import { afterEach, describe, expect, it, vi } from 'vitest'

import { criarPreGuia } from './api'
import { formVazio } from './NovaPreGuiaPage/types'

import type {
  Beneficiario,
} from '../../shared/types/domain'

/**
 * Testes da chamada de criacao da pre-guia pelo beneficiario.
 */

afterEach(() => vi.unstubAllGlobals())

const beneficiarioTeste: Beneficiario = {
  nome: 'Maria Silva',
  precCp: '45872213300',
  cpf: '12345678900',
  telefone: '11999999999',
  dataNascimento: null,
  grupo: 'Exército Brasileiro · FUSEX',
}

describe('criarPreGuia', () => {
  it('envia CPF e Prec-CP sem formatação e sem procedimentoIds', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          id: 1,
          status: 'PENDENTE',
          dataEmissao: '2026-09-27T10:00:00',
          encaminhamentoUrl: 'encaminhamentos/x.pdf',
          ocsId: 1,
        }),
        {
          status: 201,
          headers: { 'Content-Type': 'application/json' },
        },
      ),
    )

    vi.stubGlobal('fetch', fetchMock)

    const form = {
      ...formVazio,
      ocsId: 1,
      arquivo: new File(
        ['x'],
        'a.pdf',
        { type: 'application/pdf' },
      ),
    }

    await criarPreGuia(form, beneficiarioTeste)

    const enviado = fetchMock.mock.calls[0][1].body as FormData

    expect(enviado.get('cpf')).toBe('12345678900')
    expect(enviado.get('precCp')).toBe('45872213300')
    expect(enviado.get('procedimentoIds')).toBeNull()
  })
})
