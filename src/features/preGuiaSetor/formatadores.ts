import { formatarPrecCp } from '../../shared/utils/formatadores';
import type { MedicoCriador, ProcedimentoDetalhe } from './types';

/**
 * Textos exibidos no detalhe da pre-guia do Setor de Guias.
 */

export function formatarExame(procedimento: ProcedimentoDetalhe): string {
  return `${procedimento.codigoTuss} · ${procedimento.nome}`;
}

/** T17-FE: "Criada pelo [patente] [nome] (CRM [crm] · Prec CP [prec cp])"; sem Prec CP, "Prec CP —". */
export function textoCriadaPor(medico: MedicoCriador): string {
  const precCp = medico.precCp?.trim() ? formatarPrecCp(medico.precCp) : '—';
  return `Criada pelo ${medico.patente} ${medico.nome} (CRM ${medico.crm} · Prec CP ${precCp})`;
}
