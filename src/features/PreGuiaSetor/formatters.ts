import type { MedicoCriador, ProcedimentoDetalhe } from './types';

/** "45810020001" vira "458100200-01", como aparece na arte. */
export function formatarPrecCp(precCp: string): string {
  const digitos = precCp.replace(/\D/g, '');
  return digitos.length === 11 ? `${digitos.slice(0, 9)}-${digitos.slice(9)}` : precCp;
}

export function formatarExame(procedimento: ProcedimentoDetalhe): string {
  return `${procedimento.codigoTuss} · ${procedimento.nome}`;
}

export function textoCriadaPor(medico: MedicoCriador): string {
  return `Criada pelo ${medico.patente} ${medico.nome} (CRM ${medico.crm})`;
}

/** Mantém só dígitos (campo "Número da Guia"). */
export function somenteDigitos(valor: string): string {
  return valor.replace(/\D/g, '');
}
