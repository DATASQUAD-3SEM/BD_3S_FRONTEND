import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import { describe, expect, it, vi } from 'vitest'
import AuditadasPage from './AuditadasPage'
import type { EspelhoDetalhe, FaturaAuditada, SetorFaturasApi } from './types'

/** T24-FE4: Faturas Auditadas em cartões, selo "Concluída" e detalhe só de leitura com o controle de fluxo. */

const auditada = (id: number, numero: string, visualizacao: string | null): FaturaAuditada => ({
  id,
  ocs: 'Laboratorio Exemplo',
  dataInicio: '2026-09-01T00:00:00',
  dataEnvio: '2026-09-30T09:00:00',
  numeroFatura: numero,
  dataEntrada: '2026-09-30T09:00:00',
  dataVisualizacao: visualizacao,
  valorInformado: 1000,
  valorGlosa: 120,
  valorFinal: 880,
})

const detalhe: EspelhoDetalhe = {
  id: 6,
  ocs: 'Laboratorio Exemplo',
  dataInicio: '2026-09-01T00:00:00',
  dataEnvio: '2026-09-30T09:00:00',
  dataEntrada: '2026-09-30T09:00:00',
  situacao: 'AUDITADA',
  numeroFatura: '006/2026',
  valorTotal: 1000,
  linhas: [
    {
      itemId: 1, guiaId: 10, guiaNumero: '202610690', paciente: 'Ana Lima', codigo: '41001109',
      procedimento: 'TC - Abdome superior', quantidadeSessoes: 2, valorSessao: 500, valorTotal: 1000,
      valorContrato: 440, origemContrato: 'MANUAL', observacao: 'Conferido com o contrato', glosa: 120,
      comparacao: 'MAIOR',
    },
  ],
  totais: { informado: 1000, glosa: 120, final: 880 },
  eventos: [],
  controleFluxo: [
    { etapa: 'Protocolo', setor: 'Setor de Faturas', dataEntrada: '2026-09-30T09:00:00', dataSaida: '2026-09-30T10:00:00', responsavel: 'Ana Silva', valorInicial: 1000, valorFinal: null, motivo: null },
    { etapa: 'Lisura / Glosa', setor: 'Rastreabilidade', dataEntrada: '2026-10-01T09:00:00', dataSaida: '2026-10-02T09:00:00', responsavel: 'Bruno Lima', valorInicial: 1000, valorFinal: 880, motivo: null },
    { etapa: 'Auditagem', setor: 'Auditoria', dataEntrada: '2026-10-02T09:00:00', dataSaida: '2026-10-05T10:00:00', responsavel: 'Carla Souza', valorInicial: 880, valorFinal: 880, motivo: null },
    { etapa: 'Arquivo', setor: 'Arquivo', dataEntrada: '2026-10-05T10:00:00', dataSaida: null, responsavel: null, valorInicial: null, valorFinal: null, motivo: null },
  ],
}

function api(listarAuditadas: SetorFaturasApi['listarAuditadas'], detalharEspelho = vi.fn().mockResolvedValue(detalhe)) {
  return {
    listarAuditadas,
    detalharEspelho,
    listarEspelhosRecebidos: vi.fn(),
    proximoNumeroFatura: vi.fn(),
    protocolarFatura: vi.fn(),
    enviarParaLisura: vi.fn(),
  } as unknown as SetorFaturasApi
}

describe('AuditadasPage (T24-FE4)', () => {
  it('um cartão por fatura, da visualização mais recente para a mais antiga, com selo Concluída', async () => {
    const lista = vi.fn().mockResolvedValue([
      auditada(5, '005/2026', '2026-10-01T10:00:00'),
      auditada(6, '006/2026', '2026-10-05T10:00:00'),
    ])
    render(<AuditadasPage api={api(lista)} />)

    const cartoes = await screen.findAllByRole('button')
    expect(cartoes.map((c) => c.textContent)).toEqual([
      'Fatura nº 006/2026 · Laboratorio ExemploConcluída',
      'Fatura nº 005/2026 · Laboratorio ExemploConcluída',
    ])
    expect(screen.getByText(/Concluída em 05\/10\/2026 · Informado: R\$ 1\.000,00 · Glosa: R\$ 120,00 · Final: R\$ 880,00/))
      .toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('clicar abre o detalhe só de leitura com a tabela e o controle de fluxo completo', async () => {
    const usuario = userEvent.setup()
    render(<AuditadasPage api={api(vi.fn().mockResolvedValue([auditada(6, '006/2026', '2026-10-05T10:00:00')]))} />)

    await usuario.click(await screen.findByRole('button', { name: /006\/2026/ }))

    const [tabela] = await screen.findAllByRole('table')
    expect(within(tabela).getByText('202610690')).toBeInTheDocument()
    expect(within(tabela).getByText('Conferido com o contrato')).toBeInTheDocument()
    expect(screen.getByText(/Valor final após lisura: R\$ 880,00/)).toBeInTheDocument()
    for (const etapa of ['Protocolo', 'Lisura / Glosa', 'Auditagem', 'Arquivo']) {
      expect(screen.getAllByText(etapa).length).toBeGreaterThan(0)
    }
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
  })

  it('mostra mensagem quando não há faturas auditadas', async () => {
    render(<AuditadasPage api={api(vi.fn().mockResolvedValue([]))} />)

    expect(await screen.findByText('Nenhuma fatura auditada ainda.')).toBeInTheDocument()
  })

  it('mostra erro quando a lista não carrega', async () => {
    render(<AuditadasPage api={api(vi.fn().mockRejectedValue(new Error('falhou')))} />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as faturas auditadas.')
  })
})
