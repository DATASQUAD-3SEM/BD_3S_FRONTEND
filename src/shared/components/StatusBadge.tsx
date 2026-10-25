import type { StatusPreGuia } from '../types/domain';

export const STATUS: Record<StatusPreGuia, { rotulo: string; classe: string }> = {
  PENDENTE: { rotulo: 'Pendente', classe: 'badge-pendente' },
  EM_ANALISE: { rotulo: 'Em análise', classe: 'badge-em-analise' },
  ATENCAO: { rotulo: 'Atenção', classe: 'badge-atencao' },
  CONCLUIDA: { rotulo: 'Concluída', classe: 'badge-concluida' },
};

export default function StatusBadge({ status }: { status: StatusPreGuia }) {
  const info = STATUS[status] ?? { rotulo: status, classe: '' };
  return <span className={`badge ${info.classe}`}>{info.rotulo}</span>;
}
