import { afterEach, describe, expect, it, vi } from 'vitest';
import { preGuiaSetorApi } from './api';

/**
 * Testes da montagem das chamadas de leitura e anexo da Guia (T11, T22 e T16).
 */

afterEach(() => {
  vi.unstubAllGlobals();
});

const respostaJson = (corpo: unknown) =>
  new Response(JSON.stringify(corpo), { status: 200, headers: { 'Content-Type': 'application/json' } });

describe('preGuiaSetorApi', () => {
  it('anexarGuia envia o PUT do rascunho com numero, pdf, exames, ug, ugOrigem e validadeAte', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respostaJson({ numero: '202610678', nomeArquivo: 'guia.pdf' }));
    vi.stubGlobal('fetch', fetchMock);
    const pdf = new File(['%PDF-1.4'], 'guia.pdf', { type: 'application/pdf' });
    const exames = [{ codDgp: '41001109', descricao: 'TC - Abdome superior', quantidade: 1 }];

    await preGuiaSetorApi.anexarGuia(11, '202610678', pdf, exames, {
      ug: 'Cmdo Bda Inf Amv',
      ugOrigem: 'Cmdo Bda Inf Amv',
      validadeAte: '2027-01-01',
    });

    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/setor-guias/pre-guias/11/guia-rascunho');
    expect(opcoes.method).toBe('PUT');
    const formulario = opcoes.body as FormData;
    expect(formulario.get('numeroGuia')).toBe('202610678');
    expect(formulario.get('pdf')).toBeInstanceOf(File);
    expect(formulario.get('exames')).toBe(JSON.stringify(exames));
    expect(formulario.get('ug')).toBe('Cmdo Bda Inf Amv');
    expect(formulario.get('ugOrigem')).toBe('Cmdo Bda Inf Amv');
    expect(formulario.get('validadeAte')).toBe('2027-01-01');
  });

  it('extrairNumeroGuia envia só o pdf e devolve UG, UG Origem e validade lidas', async () => {
    const leitura = {
      numeroGuia: '202610678',
      ug: 'Cmdo Bda Inf Amv',
      ugOrigem: 'Cmdo Bda Inf Amv',
      validadeAte: '2026-10-20',
    };
    const fetchMock = vi.fn().mockResolvedValue(respostaJson(leitura));
    vi.stubGlobal('fetch', fetchMock);
    const pdf = new File(['%PDF-1.4'], 'guia.pdf', { type: 'application/pdf' });

    const resposta = await preGuiaSetorApi.extrairNumeroGuia(pdf);

    const [url, opcoes] = fetchMock.mock.calls[0];
    expect(url).toBe('/api/setor-guias/extrair-numero-guia');
    expect(opcoes.method).toBe('POST');
    expect([...(opcoes.body as FormData).keys()]).toEqual(['pdf']);
    expect(resposta).toEqual(leitura);
  });
});
