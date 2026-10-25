// Cliente HTTP real. Contratos: T1-BE1 (listar) e T1-BE2 (PDF da Guia).
// Usa o cliente unico (shared/api/http.ts), que coloca o prefixo /api e o header de login simulado.
import { get, getBlob } from '../../shared/api/http';
import type { MinhasPreGuiasApi, ModoPdf, PreGuiaDoBeneficiario } from './types';

const BASE = '/beneficiarios/me/pre-guias';

export const minhasPreGuiasApi: MinhasPreGuiasApi = {
  /** GET /beneficiarios/me/pre-guias */
  listar(): Promise<PreGuiaDoBeneficiario[]> {
    return get<PreGuiaDoBeneficiario[]>(BASE);
  },

  /** GET /beneficiarios/me/pre-guias/{id}/guia/pdf?modo=baixar|visualizar. Retorna um Blob. */
  obterPdf(id: number, modo: ModoPdf): Promise<Blob> {
    return getBlob(`${BASE}/${id}/guia/pdf?modo=${modo}`);
  },
};
