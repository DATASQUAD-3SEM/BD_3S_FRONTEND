import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import GlosaDetalhePage, { type GlosaDetalhe, type GlosaDetalheApi, type GuiaGlosada } from './GlosaDetalhePage'

const pendente: GuiaGlosada = {
  itemId: 1, guiaId: 10, guiaNumero: 'G-1', paciente: 'Ana', codigo: '40301', procedimento: 'Glicose',
  quantidadeSessoes: 2, valorSessao: 60, valorContrato: 52, origemContrato: 'TABELA', observacao: 'Conferir',
  decisaoOcs: null, motivoContestacaoOcs: null, glosa: 16,
}
const outraPendente: GuiaGlosada = { ...pendente, itemId: 2, guiaId: 11, guiaNumero: 'G-2', decisaoOcs: null }

function detalhe(extras: Partial<GlosaDetalhe> = {}): GlosaDetalhe {
  return {
    id: 3, numeroFatura: '003/2026', dataEnvioOcs: '2099-11-10T09:00:00', prazoOcs: '2099-11-16T23:59:59',
    prazoVencido: false, dataCiencia: null, responsavelCiencia: null, valorInformado: 500, valorGlosa: 16,
    valorFinal: 484, guiasGlosadas: [pendente, outraPendente], controleFluxo: [], ...extras,
  }
}

function renderizar(api: GlosaDetalheApi) {
  return render(
    <MemoryRouter initialEntries={['/ocs/glosas/3']}>
      <Routes>
        <Route path="/ocs/glosas/:id" element={<GlosaDetalhePage api={api} />} />
      </Routes>
    </MemoryRouter>,
  )
}

function apiCom(d: GlosaDetalhe): GlosaDetalheApi {
  return { detalhar: vi.fn().mockResolvedValue(d), decidir: vi.fn().mockResolvedValue({}) }
}

describe('GlosaDetalhePage (T27-FE2)', () => {
  it('mostra Ok e Contestar por guia pendente', async () => {
    renderizar(apiCom(detalhe()))

    const decisao = await screen.findByRole('group', { name: 'Decisão da guia G-1' })
    expect(within(decisao).getByRole('button', { name: 'Ok' })).toBeInTheDocument()
    expect(within(decisao).getByRole('button', { name: 'Contestar' })).toBeInTheDocument()
    expect(screen.getByText('Faltam 2 guia(s) sem decisão.')).toBeInTheDocument()
  })

  it('guia com duas linhas glosadas tem um único Ok/Contestar e conta como uma guia', async () => {
    const segundaLinha: GuiaGlosada = { ...pendente, itemId: 3, codigo: '40302', procedimento: 'Hemograma' }
    renderizar(apiCom(detalhe({ guiasGlosadas: [pendente, segundaLinha] })))

    expect(await screen.findAllByRole('group', { name: 'Decisão da guia G-1' })).toHaveLength(1)
    expect(screen.getByText('40301 · Glicose')).toBeInTheDocument()
    expect(screen.getByText('40302 · Hemograma')).toBeInTheDocument()
    expect(screen.getByText('Faltam 1 guia(s) sem decisão.')).toBeInTheDocument()
  })

  it('confirmar fica desabilitado enquanto faltar decisão', async () => {
    const user = userEvent.setup()
    renderizar(apiCom(detalhe()))
    const decisao = await screen.findByRole('group', { name: 'Decisão da guia G-1' })

    await user.click(within(decisao).getByRole('button', { name: 'Ok' }))

    expect(screen.getByText('Faltam 1 guia(s) sem decisão.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar decisão' })).toBeDisabled()
  })

  it('contestar sem motivo de 10 caracteres mantém confirmar desabilitado', async () => {
    const user = userEvent.setup()
    renderizar(apiCom(detalhe()))
    const g1 = await screen.findByRole('group', { name: 'Decisão da guia G-1' })
    const g2 = screen.getByRole('group', { name: 'Decisão da guia G-2' })
    await user.click(within(g1).getByRole('button', { name: 'Ok' }))
    await user.click(within(g2).getByRole('button', { name: 'Contestar' }))
    await user.type(screen.getByLabelText('Motivo da contestação da guia G-2'), 'curto')

    expect(screen.getByText('O motivo da contestação precisa ter pelo menos 10 caracteres.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Confirmar decisão' })).toBeDisabled()
  })

  it('com todas as decisões válidas, confirmar fica habilitado', async () => {
    const user = userEvent.setup()
    renderizar(apiCom(detalhe()))
    const g1 = await screen.findByRole('group', { name: 'Decisão da guia G-1' })
    const g2 = screen.getByRole('group', { name: 'Decisão da guia G-2' })
    await user.click(within(g1).getByRole('button', { name: 'Ok' }))
    await user.click(within(g2).getByRole('button', { name: 'Contestar' }))
    await user.type(screen.getByLabelText('Motivo da contestação da guia G-2'), 'Valor do contrato atual e correto')

    expect(screen.getByRole('button', { name: 'Confirmar decisão' })).toBeEnabled()
  })

  it('com ciência já dada, não mostra a coluna de decisão', async () => {
    const todasOk = detalhe({
      dataCiencia: '2026-11-12T10:00:00',
      responsavelCiencia: 'Ana Silva',
      guiasGlosadas: [{ ...pendente, decisaoOcs: 'OK' }],
    })
    renderizar(apiCom(todasOk))

    expect(await screen.findByText(/Ciência dada em .* por Ana Silva/)).toBeInTheDocument()
    expect(screen.getByText('Ciência já registrada para todas as guias. Nada mais a fazer aqui.')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirmar decisão' })).not.toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Sua decisão' })).not.toBeInTheDocument()
  })

  it('com o prazo vencido e sem decisão, a tela fica só de leitura com o aviso de prazo vencido', async () => {
    const vencida = detalhe({ dataEnvioOcs: '2026-10-07T09:00:00', prazoOcs: '2026-10-12T23:59:59', prazoVencido: true })
    renderizar(apiCom(vencida))

    expect(
      await screen.findByText(
        'O prazo de 3 dias úteis venceu em 12/10/2026 sem decisão. A glosa segue como lisurada pela rastreabilidade e a fatura pode seguir para a auditoria.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByRole('columnheader', { name: 'Sua decisão' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ok' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Contestar' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Confirmar decisão' })).not.toBeInTheDocument()
    expect(screen.queryByText('Ciência já registrada para todas as guias. Nada mais a fazer aqui.')).not.toBeInTheDocument()
  })

  it('dentro do prazo e sem decisão, não mostra o aviso de prazo vencido nem o de ciência', async () => {
    renderizar(apiCom(detalhe()))

    expect(await screen.findByRole('button', { name: 'Confirmar decisão' })).toBeInTheDocument()
    expect(screen.queryByText(/O prazo de 3 dias úteis venceu/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Ciência já registrada/)).not.toBeInTheDocument()
  })

  it('erro ao carregar mostra a mensagem', async () => {
    renderizar({ detalhar: vi.fn().mockRejectedValue(new Error("falhou")), decidir: vi.fn() })

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar a fatura.')
  })

  it('confirmar com contestação envia o motivo e o responsável, e volta para a lista', async () => {
    const user = userEvent.setup()
    const api = apiCom(detalhe())
    render(
      <MemoryRouter initialEntries={['/ocs/glosas/3']}>
        <Routes>
          <Route path="/ocs/glosas/:id" element={<GlosaDetalhePage api={api} />} />
          <Route path="/ocs/glosas" element={<p>LISTA DE GLOSAS</p>} />
        </Routes>
      </MemoryRouter>,
    )
    const g1 = await screen.findByRole('group', { name: 'Decisão da guia G-1' })
    const g2 = screen.getByRole('group', { name: 'Decisão da guia G-2' })
    await user.click(within(g1).getByRole('button', { name: 'Ok' }))
    await user.click(within(g2).getByRole('button', { name: 'Contestar' }))
    await user.type(screen.getByLabelText('Motivo da contestação da guia G-2'), 'Valor do contrato correto')
    await user.click(screen.getByRole('button', { name: 'Confirmar decisão' }))

    expect(screen.getByText(/Pelo menos uma guia foi contestada/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sim, confirmar decisão' })).toBeDisabled()
    await user.type(screen.getByLabelText('Responsável (seu nome)'), 'Ana Silva')
    await user.click(screen.getByRole('button', { name: 'Sim, confirmar decisão' }))

    expect(api.decidir).toHaveBeenCalledWith(3, {
      decisoes: [
        { guiaId: 10, decisao: 'OK', motivo: null },
        { guiaId: 11, decisao: 'CONTESTADA', motivo: 'Valor do contrato correto' },
      ],
      responsavel: 'Ana Silva',
    })
    expect(await screen.findByText('LISTA DE GLOSAS')).toBeInTheDocument()
  })

  it('guia com duas linhas glosadas é enviada uma única vez', async () => {
    const user = userEvent.setup()
    const segundaLinha: GuiaGlosada = { ...pendente, itemId: 3, codigo: '40302', procedimento: 'Hemograma' }
    const api = apiCom(detalhe({ guiasGlosadas: [pendente, segundaLinha] }))
    renderizar(api)
    const g1 = await screen.findByRole('group', { name: 'Decisão da guia G-1' })
    await user.click(within(g1).getByRole('button', { name: 'Ok' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar decisão' }))
    await user.type(screen.getByLabelText('Responsável (seu nome)'), 'Ana Silva')
    await user.click(screen.getByRole('button', { name: 'Sim, confirmar decisão' }))

    expect(api.decidir).toHaveBeenCalledWith(3, {
      decisoes: [{ guiaId: 10, decisao: 'OK', motivo: null }],
      responsavel: 'Ana Silva',
    })
  })

  it('sem contestação, o painel diz que a fatura fica liberada para a auditoria', async () => {
    const user = userEvent.setup()
    renderizar(apiCom(detalhe()))
    const g1 = await screen.findByRole('group', { name: 'Decisão da guia G-1' })
    const g2 = screen.getByRole('group', { name: 'Decisão da guia G-2' })
    await user.click(within(g1).getByRole('button', { name: 'Ok' }))
    await user.click(within(g2).getByRole('button', { name: 'Ok' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar decisão' }))

    expect(screen.getByText(/Todas as guias ficaram com 'Ok': a fatura fica liberada para a auditoria\./)).toBeInTheDocument()
  })

  it('erro do servidor aparece no painel e a decisão continua pendente', async () => {
    const user = userEvent.setup()
    const api = apiCom(detalhe())
    api.decidir = vi.fn().mockRejectedValue(new Error('Prazo de 3 dias uteis ja venceu'))
    renderizar(api)
    const g1 = await screen.findByRole('group', { name: 'Decisão da guia G-1' })
    const g2 = screen.getByRole('group', { name: 'Decisão da guia G-2' })
    await user.click(within(g1).getByRole('button', { name: 'Ok' }))
    await user.click(within(g2).getByRole('button', { name: 'Ok' }))
    await user.click(screen.getByRole('button', { name: 'Confirmar decisão' }))
    await user.type(screen.getByLabelText('Responsável (seu nome)'), 'Ana Silva')
    await user.click(screen.getByRole('button', { name: 'Sim, confirmar decisão' }))

    expect(await screen.findByText('Prazo de 3 dias uteis ja venceu')).toBeInTheDocument()
    expect(screen.getByRole('dialog', { name: 'Confirmar decisão sobre as glosas' })).toBeInTheDocument()
  })
})
