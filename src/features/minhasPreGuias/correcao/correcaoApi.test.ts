import { afterEach, describe, expect, it, vi } from 'vitest';
import { correcaoApi } from './correcaoApi';

/**
 * Testes do cliente da correcao pelo beneficiario: a busca de OCS usa o endpoint do proprio beneficiario (T9-BE3).
 */

afterEach(() => vi.unstubAllGlobals());

describe('correcaoApi.buscarOcs', () => {
  it('chama GET /beneficiarios/me/ocs com o termo e devolve a lista', async () => {
    const ocs = [{ id: 2, nome: 'Hospital Exemplo', contrato: 'EXEMPLO-002', tipo: 'PSA' }];
    const fetchMock = vi.fn().mockResolvedValue(
      new Response(JSON.stringify(ocs), { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const resultado = await correcaoApi.buscarOcs(' hosp ');

    expect(fetchMock.mock.calls[0][0]).toBe('/api/beneficiarios/me/ocs?busca=hosp');
    expect(resultado).toEqual(ocs);
  });

  it('sem termo, pede a lista inicial', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      new Response('[]', { status: 200, headers: { 'Content-Type': 'application/json' } }),
    );
    vi.stubGlobal('fetch', fetchMock);

    await correcaoApi.buscarOcs('');

    expect(fetchMock.mock.calls[0][0]).toBe('/api/beneficiarios/me/ocs');
  });
});
