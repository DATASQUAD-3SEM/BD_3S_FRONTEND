import type { MedicoCriador, ProcedimentoDetalhe } from './types';

export function formatarExame(procedimento: ProcedimentoDetalhe): string {
  return `${procedimento.codigoTuss} · ${procedimento.nome}`;
}

export function textoCriadaPor(medico: MedicoCriador): string {
  return `Criada pelo ${medico.patente} ${medico.nome} (CRM ${medico.crm})`;
}
