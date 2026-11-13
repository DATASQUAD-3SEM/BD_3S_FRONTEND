import type { SituacaoGuia } from './types'

export const SITUACOES: Record<SituacaoGuia, { rotulo: string; classe: string }> = {
  NAO_ENVIADA: { rotulo: 'Não enviada', classe: 'badge-nao-enviada' },
  ENVIADA: { rotulo: 'Enviada', classe: 'badge-enviada' },
  EM_EXECUCAO: { rotulo: 'Em execução', classe: 'badge-em-execucao' },
  REALIZADA: { rotulo: 'Realizada', classe: 'badge-realizada' },
  ENCERRADA: { rotulo: 'Encerrada', classe: 'badge-encerrada' },
  VENCIDA: { rotulo: 'Vencida', classe: 'badge-vencida' },
}

export default function SituacaoGuiaBadge({ situacao }: { situacao: SituacaoGuia }) {
  const info = SITUACOES[situacao] ?? { rotulo: situacao, classe: '' }
  return <span className={`badge ${info.classe}`}>{info.rotulo}</span>
}