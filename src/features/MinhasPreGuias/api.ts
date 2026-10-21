// Cliente HTTP real. Contratos: T1-BE1 (listar) e T1-BE2 (PDF da Guia).
// O token de autenticação deve ser incluído em `cabecalhos()` quando a autenticação existir.
import type { MinhasPreGuiasApi, ModoPdf, PreGuiaDoBeneficiario } from './types';

const BASE_URL: string = import.meta.env?.VITE_API_URL ?? '';

function cabecalhos(): HeadersInit {
  return {};
}

async function verificar(resposta: Response, mensagem: string): Promise<Response> {
  if (!resposta.ok) {
    throw new Error(mensagem);
  }
  return resposta;
}

export const minhasPreGuiasApi: MinhasPreGuiasApi = {
  /** GET /beneficiarios/me/pre-guias */
  async listar(): Promise<PreGuiaDoBeneficiario[]> {
    const resposta = await fetch(`${BASE_URL}/beneficiarios/me/pre-guias`, { headers: cabecalhos() });
    await verificar(resposta, 'Não foi possível carregar suas pré-guias.');
    return resposta.json();
  },

  /** GET /beneficiarios/me/pre-guias/{id}/guia/pdf?modo=baixar|visualizar. Retorna um Blob. */
  async obterPdf(id: number, modo: ModoPdf): Promise<Blob> {
    const resposta = await fetch(
      `${BASE_URL}/beneficiarios/me/pre-guias/${id}/guia/pdf?modo=${modo}`,
      { headers: cabecalhos() },
    );
    await verificar(resposta, 'Não foi possível obter o PDF da Guia.');
    return resposta.blob();
  },
};
