import { ApiError } from '../../shared/api/http'
import type { EspelhoDetalhe, EspelhoResumo, FaturaAuditada, LinhaEspelho, SetorFaturasApi } from './types'

/**
 * Mock em memoria da tela de Espelhos Recebidos (T24-FE1). Sete espelhos do prototipo, cobrindo as situacoes
 * do fluxo: espelho nº 1 (sem nº), faturas 001/2026 (Protocolada), 002/2026 (Em lisura), 003 e 004/2026
 * (Aguardando a OCS, com glosa), 005/2026 (Em auditoria, sem glosa) e 006/2026 (Auditada).
 *
 * listarEspelhosRecebidos devolve so os nao-Auditados (o backend listar exclui Auditadas); a fatura 006
 * aparece na aba de Faturas Auditadas (T24-FE4). A lista volta em dataEnvio ASC para a tela ordenar
 * "do mais recente para o mais antigo". Para vazio/erro, injete com vi.spyOn(api, 'listarEspelhosRecebidos').
 */

interface OpcoesMock {
  atrasoMs?: number
}

const iso = (data: string) => `${data}T10:00:00`

/** Data relativa a hoje (dias a somar), em ISO com o horario informado. Mantem o mock "dentro do prazo" em qualquer dia. */
function relativo(dias: number, horario: string): string {
  const d = new Date()
  d.setDate(d.getDate() + dias)
  const dois = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${dois(d.getMonth() + 1)}-${dois(d.getDate())}T${horario}`
}

function linha(
  itemId: number,
  guiaId: number,
  guiaNumero: string,
  paciente: string,
  codigo: string,
  procedimento: string,
  quantidadeSessoes: number,
  valorSessao: number,
  glosa: number | null = null,
): LinhaEspelho {
  const valorTotal = Number((quantidadeSessoes * valorSessao).toFixed(2))
  return {
    itemId,
    guiaId,
    guiaNumero,
    paciente,
    codigo,
    procedimento,
    quantidadeSessoes,
    valorSessao,
    valorTotal,
    valorContrato: valorSessao,
    origemContrato: 'CONTRATO',
    observacao: null,
    glosa,
    comparacao: 'CONFORME',
  }
}

/** valorTotal (informado) = soma das linhas; usado no resumo e no totais. */
function valorInformado(linhas: LinhaEspelho[]): number {
  return Number(linhas.reduce((acc, l) => acc + l.valorTotal, 0).toFixed(2))
}

interface Semente {
  resumo: EspelhoResumo
  linhas: LinhaEspelho[]
  /** glosa total apos lisura; null quando nao houve lisura ou nao houve glosa. */
  glosa: number | null
  /** valorFinal apos lisura; null enquanto a lisura nao terminou. */
  valorFinal: number | null
  controleFluxo: EspelhoDetalhe['controleFluxo']
}

function sementes(): Semente[] {
  return [
    // espelho nº 1 — Laboratório Exemplo, sem nº (RECEBIDO). Mais recente.
    {
      resumo: { id: 1, ocs: 'Laboratório Exemplo', dataInicio: iso('2026-11-13'), dataEnvio: iso('2026-11-18'), dataEntrada: iso('2026-11-18'), situacao: 'RECEBIDO', numeroFatura: null, valorTotal: 350.0 },
      linhas: [linha(101, 201, '202610678', 'Marta Souza Lima', '41001109', 'TC - Abdome superior', 1, 350.0)],
      glosa: null,
      valorFinal: null,
      controleFluxo: [],
    },
    // 001/2026 — Protocolada.
    {
      resumo: { id: 2, ocs: 'Laboratório Exemplo', dataInicio: iso('2026-11-10'), dataEnvio: iso('2026-11-15'), dataEntrada: iso('2026-11-15'), situacao: 'PROTOCOLADA', numeroFatura: '001/2026', valorTotal: 710.0 },
      linhas: [
        linha(201, 201, '202610678', 'Marta Souza Lima', '41001109', 'TC - Abdome superior', 1, 350.0),
        linha(202, 202, '202610679', 'Antonio Carlos Ferreira', '41001110', 'Ultrassonografia abdome total', 2, 180.0),
      ],
      glosa: null,
      valorFinal: null,
      controleFluxo: [
        { etapa: 'Protocolo', setor: 'Setor de Faturas', dataEntrada: iso('2026-11-15'), dataSaida: iso('2026-11-15'), responsavel: 'setor.fatura', valorInicial: 710.0, valorFinal: null, motivo: null },
      ],
    },
    // 002/2026 — Em lisura.
    {
      resumo: { id: 3, ocs: 'Hospital Exemplo', dataInicio: iso('2026-11-05'), dataEnvio: iso('2026-11-10'), dataEntrada: iso('2026-11-10'), situacao: 'EM_LISURA', numeroFatura: '002/2026', valorTotal: 135.0 },
      linhas: [linha(301, 203, '202610680', 'João Pereira', '40304361', 'Hemograma completo', 3, 45.0)],
      glosa: null,
      valorFinal: null,
      controleFluxo: [
        { etapa: 'Protocolo', setor: 'Setor de Faturas', dataEntrada: iso('2026-11-10'), dataSaida: iso('2026-11-10'), responsavel: 'setor.fatura', valorInicial: 135.0, valorFinal: null, motivo: null },
        { etapa: 'Lisura / Glosa', setor: 'Rastreabilidade', dataEntrada: iso('2026-11-11'), dataSaida: null, responsavel: null, valorInicial: 135.0, valorFinal: null, motivo: null },
      ],
    },
    // 003/2026 — Aguardando a OCS (com glosa, dentro do prazo).
    {
      resumo: { id: 4, ocs: 'Hospital Exemplo', dataInicio: iso('2026-10-31'), dataEnvio: iso('2026-11-05'), dataEntrada: iso('2026-11-05'), situacao: 'AGUARDANDO_OCS', numeroFatura: '003/2026', valorTotal: 500.0, dataEnvioOcs: relativo(-1, '09:00:00'), prazoOcs: relativo(4, '23:59:59'), dataCiencia: null },
      linhas: [
        linha(401, 204, '202610681', 'Ana Lima', '41001109', 'TC - Abdome superior', 1, 350.0),
        linha(402, 205, '202610682', 'Carlos Souza', '40301630', 'Glicose', 5, 30.0, 50.0),
      ],
      glosa: 50.0,
      valorFinal: 450.0,
      controleFluxo: [
        { etapa: 'Protocolo', setor: 'Setor de Faturas', dataEntrada: iso('2026-11-05'), dataSaida: iso('2026-11-05'), responsavel: 'setor.fatura', valorInicial: 500.0, valorFinal: null, motivo: null },
        { etapa: 'Lisura / Glosa', setor: 'Rastreabilidade', dataEntrada: iso('2026-11-06'), dataSaida: iso('2026-11-08'), responsavel: 'rastreabilidade', valorInicial: 500.0, valorFinal: 450.0, motivo: null },
        { etapa: 'Glosa / OCS', setor: 'OCS', dataEntrada: iso('2026-11-08'), dataSaida: null, responsavel: null, valorInicial: 450.0, valorFinal: 450.0, motivo: null },
      ],
    },
    // 004/2026 — Aguardando a OCS (com glosa, prazo vencido).
    {
      resumo: { id: 5, ocs: 'Clínica Exemplo', dataInicio: iso('2026-10-23'), dataEnvio: iso('2026-10-28'), dataEntrada: iso('2026-10-28'), situacao: 'AGUARDANDO_OCS', numeroFatura: '004/2026', valorTotal: 360.0, dataEnvioOcs: iso('2026-11-02'), prazoOcs: '2026-11-05T23:59:59', dataCiencia: null },
      linhas: [linha(501, 206, '202610683', 'Beatriz Alves', '41001110', 'Ultrassonografia abdome total', 2, 180.0)],
      glosa: 60.0,
      valorFinal: 300.0,
      controleFluxo: [
        { etapa: 'Protocolo', setor: 'Setor de Faturas', dataEntrada: iso('2026-10-28'), dataSaida: iso('2026-10-28'), responsavel: 'setor.fatura', valorInicial: 360.0, valorFinal: null, motivo: null },
        { etapa: 'Lisura / Glosa', setor: 'Rastreabilidade', dataEntrada: iso('2026-10-29'), dataSaida: iso('2026-11-02'), responsavel: 'rastreabilidade', valorInicial: 360.0, valorFinal: 300.0, motivo: null },
        { etapa: 'Glosa / OCS', setor: 'OCS', dataEntrada: iso('2026-11-02'), dataSaida: null, responsavel: null, valorInicial: 300.0, valorFinal: 300.0, motivo: null },
      ],
    },
    // 005/2026 — Em auditoria (sem glosa).
    {
      resumo: { id: 6, ocs: 'Laboratório Exemplo', dataInicio: iso('2026-10-15'), dataEnvio: iso('2026-10-20'), dataEntrada: iso('2026-10-20'), situacao: 'EM_AUDITORIA', numeroFatura: '005/2026', valorTotal: 90.0 },
      linhas: [linha(601, 207, '202610684', 'Paulo Costa', '40304361', 'Hemograma completo', 2, 45.0)],
      glosa: null,
      valorFinal: 90.0,
      controleFluxo: [
        { etapa: 'Protocolo', setor: 'Setor de Faturas', dataEntrada: iso('2026-10-20'), dataSaida: iso('2026-10-20'), responsavel: 'setor.fatura', valorInicial: 90.0, valorFinal: null, motivo: null },
        { etapa: 'Lisura / Glosa', setor: 'Rastreabilidade', dataEntrada: iso('2026-10-21'), dataSaida: iso('2026-10-25'), responsavel: 'rastreabilidade', valorInicial: 90.0, valorFinal: 90.0, motivo: null },
        { etapa: 'Auditagem', setor: 'Auditoria', dataEntrada: iso('2026-10-26'), dataSaida: null, responsavel: null, valorInicial: 90.0, valorFinal: 90.0, motivo: null },
      ],
    },
    // 006/2026 — Auditada (nao aparece na lista de recebidos; aba propria do T24-FE4).
    {
      resumo: { id: 7, ocs: 'Clínica Exemplo', dataInicio: iso('2026-10-05'), dataEnvio: iso('2026-10-10'), dataEntrada: iso('2026-10-10'), situacao: 'AUDITADA', numeroFatura: '006/2026', valorTotal: 350.0 },
      linhas: [linha(701, 208, '202610685', 'Rosa Dias', '41001109', 'TC - Abdome superior', 1, 350.0)],
      glosa: null,
      valorFinal: 350.0,
      controleFluxo: [
        { etapa: 'Protocolo', setor: 'Setor de Faturas', dataEntrada: iso('2026-10-10'), dataSaida: iso('2026-10-10'), responsavel: 'setor.fatura', valorInicial: 350.0, valorFinal: null, motivo: null },
        { etapa: 'Lisura / Glosa', setor: 'Rastreabilidade', dataEntrada: iso('2026-10-11'), dataSaida: iso('2026-10-15'), responsavel: 'rastreabilidade', valorInicial: 350.0, valorFinal: 350.0, motivo: null },
        { etapa: 'Auditagem', setor: 'Auditoria', dataEntrada: iso('2026-10-16'), dataSaida: iso('2026-10-18'), responsavel: 'auditoria', valorInicial: 350.0, valorFinal: 350.0, motivo: null },
        { etapa: 'Arquivo', setor: 'Setor de Faturas', dataEntrada: iso('2026-10-19'), dataSaida: iso('2026-10-19'), responsavel: 'setor.fatura', valorInicial: 350.0, valorFinal: 350.0, motivo: null },
      ],
    },
  ]
}

export function criarMockSetorFaturas({ atrasoMs = 0 }: OpcoesMock = {}): SetorFaturasApi {
  const sementesFixas = sementes()
  const espera = () => (atrasoMs > 0 ? new Promise<void>((resolve) => setTimeout(resolve, atrasoMs)) : Promise.resolve())

  return {
    async listarAuditadas(): Promise<FaturaAuditada[]> {
      await espera()
      return sementesFixas
        .filter((s) => s.resumo.situacao === 'AUDITADA')
        .map((s) => ({
          id: s.resumo.id,
          ocs: s.resumo.ocs,
          dataInicio: s.resumo.dataInicio,
          dataEnvio: s.resumo.dataEnvio,
          numeroFatura: s.resumo.numeroFatura,
          dataEntrada: s.resumo.dataEntrada,
          dataVisualizacao: null,
          valorInformado: valorInformado(s.linhas),
          valorGlosa: s.glosa,
          valorFinal: s.valorFinal,
        }))
    },

    async listarEspelhosRecebidos(): Promise<EspelhoResumo[]> {
      await espera()
      // Backend listar exclui Auditadas; volta em dataEnvio ASC para a tela ordenar do mais recente.
      return sementesFixas
        .filter((s) => s.resumo.situacao !== 'AUDITADA')
        .map((s) => ({ ...s.resumo }))
        .sort((a, b) => a.dataEnvio.localeCompare(b.dataEnvio))
    },

    async proximoNumeroFatura(id: number): Promise<string> {
      await espera()
      const semente = sementesFixas.find((s) => s.resumo.id === id)
      if (!semente) throw new ApiError(404, 'Espelho não encontrado')
      const usados = sementesFixas
        .map((s) => s.resumo.numeroFatura)
        .filter((n): n is string => !!n && n.endsWith('/2026'))
        .map((n) => Number(n.slice(0, 3)))
      const proximo = Math.max(0, ...usados) + 1
      return `${String(proximo).padStart(3, '0')}/2026`
    },

    async protocolarFatura(id: number, corpo): Promise<EspelhoDetalhe> {
      await espera()
      const semente = sementesFixas.find((s) => s.resumo.id === id)
      if (!semente) throw new ApiError(404, 'Espelho não encontrado')
      if (semente.resumo.situacao !== 'RECEBIDO') throw new ApiError(409, 'Este espelho já é uma fatura.')
      semente.resumo.numeroFatura = corpo.numeroFatura
      semente.resumo.situacao = 'PROTOCOLADA'
      return this.detalharEspelho(id)
    },

    async enviarParaLisura(id: number): Promise<EspelhoDetalhe> {
      await espera()
      const semente = sementesFixas.find((s) => s.resumo.id === id)
      if (!semente) throw new ApiError(404, 'Espelho não encontrado')
      if (semente.resumo.situacao !== 'PROTOCOLADA') {
        throw new ApiError(409, 'Esta acao nao e permitida na situacao atual da fatura')
      }
      semente.resumo.situacao = 'EM_LISURA'
      return this.detalharEspelho(id)
    },

    async detalharEspelho(id: number): Promise<EspelhoDetalhe> {
      await espera()
      const semente = sementesFixas.find((s) => s.resumo.id === id)
      if (!semente) throw new ApiError(404, 'Espelho não encontrado')
      const { resumo, linhas, glosa, valorFinal, controleFluxo } = semente
      const informado = valorInformado(linhas)
      return {
        id: resumo.id,
        ocs: resumo.ocs,
        dataInicio: resumo.dataInicio,
        dataEnvio: resumo.dataEnvio,
        dataEntrada: resumo.dataEntrada,
        situacao: resumo.situacao,
        numeroFatura: resumo.numeroFatura,
        valorTotal: informado,
        linhas: linhas.map((l) => ({ ...l })),
        totais: { informado, glosa, final: valorFinal },
        eventos: [],
        controleFluxo: controleFluxo.map((e) => ({ ...e })),
        dataEnvioOcs: resumo.dataEnvioOcs ?? null,
        prazoOcs: resumo.prazoOcs ?? null,
        dataCiencia: resumo.dataCiencia ?? null,
        responsavelCiencia: null,
      }
    },
  }
}
