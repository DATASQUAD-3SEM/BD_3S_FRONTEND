import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { FaturaLisuraDetalhe, LinhaLisura } from '../rastreabilidade/types'
import AuditoriaFaturaPage from './AuditoriaFaturaPage'
import type { AuditoriaApi } from './types'

const comGlosa: LinhaLisura = {
  itemId: 1, guiaId: 10, guiaNumero: 'G-1', paciente: 'Ana', codigo: '40301', procedimento: 'Glicose',
  quantidadeSessoes: 1, valorSessao: 60, valorTotal: 60, valorContrato: 52, origemContrato: 'TABELA',
  observacao: 'Conferir com a OCS', glosa: 8, comparacao: 'ACIMA',
}
const semGlosa: LinhaLisura = {
  ...comGlosa, itemId: 2, guiaId: 11, guiaNumero: 'G-2', codigo: '99999', procedimento: 'Tomografia',
  quantidadeSessoes: 1, valorSessao: 100, valorTotal: 100, valorContrato: 100, origemContrato: 'CONFERIDO',
  observacao: null, glosa: 0, comparacao: 'CONFORME',
}

function fatura(extras: Partial<FaturaLisuraDetalhe> = {}): FaturaLisuraDetalhe {
  return {
    id: 5, ocs: 'Centro Diagnóstico Sul', dataInicio: '2026-10-03T00:00:00', dataEnvio: '2026-11-02T09:00:00',
    dataEntrada: '2026-11-02T09:00:00', situacao: 'EM_AUDITORIA', numeroFatura: '005/2026', valorTotal: 160,
    linhas: [comGlosa, semGlosa], totais: { informado: 160, glosa: 8, final: 152 }, controleFluxo: [],
    dataEnvioOcs: null, prazoOcs: null, dataCiencia: null, responsavelCiencia: null, liberadaParaAuditoria: true,
    ...extras,
  }
}

function apiCom(detalhar: AuditoriaApi['detalhar']): AuditoriaApi {
  return { listarFaturas: vi.fn(), detalhar, obterPdfGuia: vi.fn() }
}

function renderizar(api: AuditoriaApi) {
  return render(
    <MemoryRouter initialEntries={['/auditoria/faturas/5']}>
      <Routes>
        <Route path="/auditoria/faturas/:id" element={<AuditoriaFaturaPage api={api} />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('AuditoriaFaturaPage (T26-FE2)', () => {
  it('mostra a tabela só de leitura: sem campos editáveis e sem botão de decisão', async () => {
    const { container } = renderizar(apiCom(vi.fn().mockResolvedValue(fatura())))

    expect(await screen.findByText('Fatura nº 005/2026')).toBeInTheDocument()
    expect(container.querySelectorAll('input, textarea, select')).toHaveLength(0)
    expect(screen.queryByRole('button', { name: /Salvar|Enviar|Sim|Não|O valor mudou|Marcar/ })).not.toBeInTheDocument()
    expect(screen.getByText('Conferir com a OCS')).toBeInTheDocument()
    expect(screen.getByText('Glosada')).toBeInTheDocument()
    expect(screen.getByText('Sem glosa')).toBeInTheDocument()
  })

  it('o resumo bate com a soma das linhas', async () => {
    renderizar(apiCom(vi.fn().mockResolvedValue(fatura())))

    expect(await screen.findByText('Valor informado pela OCS')).toBeInTheDocument()
    expect(screen.getByText('R$ 160,00')).toBeInTheDocument()
    expect(screen.getByText(/Glosa \(cobrado a mais\)/)).toBeInTheDocument()
    expect(screen.getAllByText('R$ 8,00').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('R$ 152,00')).toBeInTheDocument()
  })

  it('mostra a faixa da OCS com a ciência quando há glosa', async () => {
    renderizar(
      apiCom(vi.fn().mockResolvedValue(fatura({ dataCiencia: '2026-11-12T10:00:00', responsavelCiencia: 'Ana Silva' }))),
    )

    expect(await screen.findByText(/A OCS deu ciência das glosas em .* \(Ana Silva\)\./)).toBeInTheDocument()
  })

  it('não mostra faixa quando não há glosa', async () => {
    const semNada = fatura({
      linhas: [semGlosa],
      totais: { informado: 100, glosa: null, final: 100 },
      dataCiencia: '2026-11-12T10:00:00',
      responsavelCiencia: 'Ana Silva',
    })
    renderizar(apiCom(vi.fn().mockResolvedValue(semNada)))

    expect(await screen.findByText('Fatura nº 005/2026')).toBeInTheDocument()
    expect(screen.queryByText(/A OCS deu ciência/)).not.toBeInTheDocument()
  })

  it('erro ao carregar mostra a mensagem', async () => {
    renderizar(apiCom(vi.fn().mockRejectedValue(new Error('falhou'))))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar a fatura.')
  })
})
