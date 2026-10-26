import type { MedicoCriador, ProcedimentoDetalhe } from './types';

/**
 * Textos exibidos no detalhe da pre-guia do Setor de Guias.
 */

export function formatarExame(procedimento: ProcedimentoDetalhe): string {
  return `${procedimento.codigoTuss} · ${procedimento.nome}`;
}

export function textoCriadaPor(medico: MedicoCriador): string {
  return `Criada pelo ${medico.patente} ${medico.nome} (CRM ${medico.crm})`;
}
