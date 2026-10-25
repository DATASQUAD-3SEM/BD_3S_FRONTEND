import { afterEach, describe, expect, it, vi } from 'vitest';
import { filaPreGuiasApi } from './api';

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  localStorage.clear();
});

describe('filaPreGuiasApi', () => {
  it('chama GET /api/setor-guias/pre-guias com busca, pagina e tamanho, e o login simulado', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respostaJson({ total: 0, pagina: 0, tamanho: 10, itens: [] }));
    vi.stubGlobal('fetch', fetchMock);
    localStorage.setItem('X-Usuario-Login', 'setor.guias');

    await filaPreGuiasApi.listar({ busca: ' Antonio ', page: 2, size: 10 });

    expect(fetchMock.mock.calls[0][0]).toBe('/api/setor-guias/pre-guias?busca=Antonio&page=2&size=10');
    const init = fetchMock.mock.calls[0][1] as RequestInit;
    expect(new Headers(init.headers).get('X-Usuario-Login')).toBe('setor.guias');
  });

  it('envia o status pelo rótulo que o backend aceita', async () => {
    const fetchMock = vi.fn().mockImplementation(() =>
      Promise.resolve(respostaJson({ total: 0, pagina: 0, tamanho: 10, itens: [] })));
    vi.stubGlobal('fetch', fetchMock);

    await filaPreGuiasApi.listar({ status: 'EM_ANALISE' });
    await filaPreGuiasApi.listar({ status: 'ATENCAO' });

    expect(fetchMock.mock.calls[0][0]).toContain('status=Em+an%C3%A1lise');
    expect(fetchMock.mock.calls[1][0]).toContain('status=Aten%C3%A7%C3%A3o');
  });

  it('sem status não envia o filtro', async () => {
    const fetchMock = vi.fn().mockResolvedValue(respostaJson({ total: 0, pagina: 0, tamanho: 10, itens: [] }));
    vi.stubGlobal('fetch', fetchMock);

    await filaPreGuiasApi.listar();

    expect(fetchMock.mock.calls[0][0]).toBe('/api/setor-guias/pre-guias?page=0&size=10');
  });

  it('erro do backend chega como erro', async () => {
    const erro = { status: 403, erro: 'Forbidden', mensagem: 'Acesso negado', detalhes: [], timestamp: 'x' };
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson(erro, 403)));

    await expect(filaPreGuiasApi.listar()).rejects.toMatchObject({ status: 403 });
  });
});
