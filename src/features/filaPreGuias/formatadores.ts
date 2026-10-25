import type { OrigemPreGuia } from './types';

/** "2026-10-12T09:30:00" vira "12/10". */
export function formatarDiaMes(iso?: string | null): string {
  if (!iso) return '';
  const [, mes, dia] = iso.slice(0, 10).split('-');
  return `${dia}/${mes}`;
}

export const ORIGEM: Record<OrigemPreGuia, string> = {
  BENEFICIARIO: 'Beneficiário',
  MEDICO: 'Médico',
};

