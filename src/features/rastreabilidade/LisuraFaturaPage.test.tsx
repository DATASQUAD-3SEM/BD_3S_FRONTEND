import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import LisuraFaturaPage from './LisuraFaturaPage'
import type { SituacaoFatura } from '../setorFatura/types'
import type { FaturaLisuraDetalhe, LinhaLisura, LisuraApi } from './types'

const tabela: LinhaLisura = {
  itemId: 1, guiaId: 10, guiaNumero: 'G-1', paciente: 'Ana', codigo: '40301', procedimento: 'Glicose',
  quantidadeSessoes: 1, valorSessao: 60, valorTotal: 60, valorContrato: 52, origemContrato: 'TABELA',
  observacao: null, glosa: null, comparacao: 'ACIMA',
}
const semPreco: LinhaLisura = {
  ...tabela, itemId: 2, guiaId: 11, guiaNumero: 'G-2', codigo: '99999', procedimento: 'Tomografia',
  quantidadeSessoes: 2, valorSessao: 100, valorTotal: 200, valorContrato: null, origemContrato: null, comparacao: 'SEM_CONTRATO',
}

function fatura(
  situacao: SituacaoFatura,
  linhas: LinhaLisura[] = [tabela, semPreco],
  extras: Partial<FaturaLisuraDetalhe> = {},
): FaturaLisuraDetalhe {
  return {
    dataEnvioOcs: null,
    prazoOcs: null,
    dataCiencia: null,
    responsavelCiencia: null,
    liberadaParaAuditoria: false,
    ...extras,
    id: 2, ocs: 'Centro Diagnóstico Sul', dataInicio: '2026-10-03T00:00:00', dataEnvio: '2026-11-02T09:00:00',
    dataEntrada: '2026-11-02T09:00:00', situacao, numeroFatura: '002/2026', valorTotal: 260,
    linhas, totais: { informado: 260, glosa: null, final: null }, controleFluxo: [],
  }
}

function apiCom(detalhe: FaturaLisuraDetalhe): LisuraApi & { salvarLisura: ReturnType<typeof vi.fn> } {
  return {
    detalhar: vi.fn().mockResolvedValue(detalhe),
    salvarLisura: vi.fn().mockResolvedValue(detalhe),
    obterPdfGuia: vi.fn(),
    enviarOcs: vi.fn(),
    enviarAuditoria: vi.fn(),
  }
}

function renderizar(api: LisuraApi) {
  return render(
    <MemoryRouter initialEntries={['/rastreabilidade/faturas/2']}>
      <Routes>
        <Route path="/rastreabilidade/faturas/:id" element={<LisuraFaturaPage api={api} />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('LisuraFaturaPage (T25-FE-2)', () => {
  it('fatura Em lisura: linha com tabela é comparada pelo sistema; linha sem preço pede Sim ou Não', async () => {
    renderizar(apiCom(fatura('EM_LISURA')))

    expect(await screen.findByText('Lisura da fatura nº 002/2026')).toBeInTheDocument()
    expect(screen.getByText('Comparado pelo sistema')).toBeInTheDocument()
    const grupo = screen.getByRole('group', { name: 'Valor de acordo com o contrato, guia G-2' })
    expect(within(grupo).getByRole('button', { name: 'Sim' })).toBeInTheDocument()
    expect(within(grupo).getByRole('button', { name: 'Não' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar lisura' })).toBeEnabled()
  })

  it('Não abre o campo de contrato; salvar envia o valor e pede o responsável', async () => {
    const user = userEvent.setup()
    const api = apiCom(fatura('EM_LISURA'))
    renderizar(api)
    await screen.findByText('Lisura da fatura nº 002/2026')

    const grupo = screen.getByRole('group', { name: 'Valor de acordo com o contrato, guia G-2' })
    await user.click(within(grupo).getByRole('button', { name: 'Não' }))
    await user.type(screen.getByLabelText('Valor de contrato (R$/sessão)'), '150')
    await user.type(await screen.findByLabelText('Responsável pelo preço (seu nome)'), 'Sd Almeida')
    await user.click(screen.getByRole('button', { name: 'Salvar lisura' }))

    await waitFor(() =>
      expect(api.salvarLisura).toHaveBeenCalledWith(2, 'Sd Almeida', [
        { itemId: 1, corrigirTabela: false, valorContrato: null, observacao: null },
        { itemId: 2, conforme: false, valorContrato: 150, observacao: null },
      ]),
    )
    expect(await screen.findByText('Lisura salva.')).toBeInTheDocument()
  })

  it('"O valor mudou?" abre a correção da linha com tabela', async () => {
    const user = userEvent.setup()
    renderizar(apiCom(fatura('EM_LISURA')))
    await screen.findByText('Lisura da fatura nº 002/2026')

    await user.click(screen.getByRole('button', { name: 'O valor mudou?' }))

    expect(screen.getByLabelText('Novo valor (R$/sessão)')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancelar correção' })).toBeInTheDocument()
  })

  it('fatura fora da lisura abre só para leitura', async () => {
    renderizar(apiCom(fatura('EM_AUDITORIA')))

    expect(await screen.findByText('Lisura da fatura nº 002/2026')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Salvar lisura' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sim' })).not.toBeInTheDocument()
  })

  it('erro ao carregar mostra a mensagem', async () => {
    const api: LisuraApi = {
      detalhar: vi.fn().mockRejectedValue(new Error('falhou')),
      salvarLisura: vi.fn(),
      obterPdfGuia: vi.fn(),
      enviarOcs: vi.fn(),
      enviarAuditoria: vi.fn(),
    }
    renderizar(api)

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar a fatura.')
  })

  it('linha aceita pela OCS fica travada com o selo, sem Sim/Não', async () => {
    const aceita: LinhaLisura = { ...semPreco, origemContrato: 'CONFERIDO', valorContrato: 100, decisaoOcs: 'OK' }
    renderizar(apiCom(fatura('EM_LISURA', [tabela, aceita])))

    expect(await screen.findByText('Ok pela OCS')).toBeInTheDocument()
    expect(screen.queryByRole('group', { name: 'Valor de acordo com o contrato, guia G-2' })).not.toBeInTheDocument()
  })

  it('linha contestada mostra o motivo e volta para decisão', async () => {
    const contestada: LinhaLisura = { ...semPreco, decisaoOcs: 'CONTESTADA', motivoContestacaoOcs: 'Valor do contrato atual' }
    renderizar(apiCom(fatura('EM_LISURA', [tabela, contestada])))

    expect(await screen.findByText('Contestada pela OCS: Valor do contrato atual')).toBeInTheDocument()
    expect(screen.getByRole('group', { name: 'Valor de acordo com o contrato, guia G-2' })).toBeInTheDocument()
  })

  it('faixa mostra a ciência da OCS quando não houve contestação', async () => {
    renderizar(
      apiCom(
        fatura('AGUARDANDO_OCS', [tabela], {
          dataCiencia: '2026-11-12T10:00:00',
          responsavelCiencia: 'Ana Silva',
          prazoOcs: '2099-11-16T23:59:59',
          liberadaParaAuditoria: true,
        }),
      ),
    )

    expect(await screen.findByText(/A OCS deu ciência das glosas em .* \(Ana Silva\)\./)).toBeInTheDocument()
  })

  it('faixa mostra prazo vencido sem decisão da OCS', async () => {
    renderizar(apiCom(fatura('AGUARDANDO_OCS', [tabela], { prazoOcs: '2000-01-05T23:59:59', liberadaParaAuditoria: true })))

    expect(await screen.findByText(/Prazo de 3 dias úteis vencido em .*, sem decisão da OCS/)).toBeInTheDocument()
  })

  it('faixa mostra aguardando a decisão dentro do prazo', async () => {
    renderizar(apiCom(fatura('AGUARDANDO_OCS', [tabela], { prazoOcs: '2099-11-16T23:59:59' })))

    expect(await screen.findByText(/Aguardando a decisão da OCS \(Ok ou contestação\)\. Prazo: até/)).toBeInTheDocument()
  })

  it('envio fica desabilitado enquanto há linha sem decisão', async () => {
    renderizar(apiCom(fatura('EM_LISURA')))

    expect(await screen.findByText('Faltam 1 linha(s) sem decisão.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Enviar glosas à OCS' })).toBeDisabled()
  })

  it('sem glosa, envio para a auditoria salva a lisura antes de enviar', async () => {
    const user = userEvent.setup()
    const tabelaCorrigida: LinhaLisura = { ...tabela, origemContrato: 'TABELA_CORRIGIDA', valorContrato: 60, valorSessao: 60, valorTotal: 60 }
    const conferida: LinhaLisura = { ...semPreco, origemContrato: 'CONFERIDO', valorContrato: 100 }
    const api = apiCom(fatura('EM_LISURA', [tabelaCorrigida, conferida]))
    const enviada = fatura('EM_AUDITORIA', [tabelaCorrigida, conferida])
    api.enviarAuditoria = vi.fn().mockResolvedValue(enviada)
    renderizar(api)

    await user.click(await screen.findByRole('button', { name: 'Enviar para a auditoria' }))
    await user.type(screen.getByLabelText('Responsável (seu nome)'), 'Sd Almeida')
    await user.click(screen.getByRole('button', { name: 'Sim, enviar para a auditoria' }))

    await waitFor(() => expect(api.enviarAuditoria).toHaveBeenCalledWith(2, 'Sd Almeida'))
    expect(api.salvarLisura.mock.invocationCallOrder[0]).toBeLessThan(
      (api.enviarAuditoria as ReturnType<typeof vi.fn>).mock.invocationCallOrder[0],
    )
    expect(await screen.findByText('Fatura enviada para a auditoria.')).toBeInTheDocument()
  })

  it('aguardando a OCS sem liberação não permite enviar para a auditoria', async () => {
    renderizar(apiCom(fatura('AGUARDANDO_OCS', [tabela], { prazoOcs: '2099-11-16T23:59:59' })))

    expect(await screen.findByRole('button', { name: 'Enviar para a auditoria' })).toBeDisabled()
    expect(screen.getByText('Aguardando a decisão da OCS ou o fim do prazo de 3 dias úteis.')).toBeInTheDocument()
  })

  it('aguardando a OCS liberada envia para a auditoria sem salvar a lisura', async () => {
    const user = userEvent.setup()
    const api = apiCom(fatura('AGUARDANDO_OCS', [tabela], { prazoOcs: '2000-01-05T23:59:59', liberadaParaAuditoria: true }))
    api.enviarAuditoria = vi.fn().mockResolvedValue(fatura('EM_AUDITORIA', [tabela]))
    renderizar(api)

    await user.click(await screen.findByRole('button', { name: 'Enviar para a auditoria' }))
    await user.type(screen.getByLabelText('Responsável (seu nome)'), 'Sd Almeida')
    await user.click(screen.getByRole('button', { name: 'Sim, enviar para a auditoria' }))

    await waitFor(() => expect(api.enviarAuditoria).toHaveBeenCalledWith(2, 'Sd Almeida'))
    expect(api.salvarLisura).not.toHaveBeenCalled()
  })
})
