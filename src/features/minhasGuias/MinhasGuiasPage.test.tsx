import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom/vitest'
import MinhasGuiasPage from './MinhasGuiasPage'
import type { GuiaDoBeneficiario, SituacaoSessao } from './types'

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function sessao(
  id: number,
  procedimento: string,
  numero: number,
  status: SituacaoSessao,
  dataSolicitacao: string | null = null,
  dataAssinatura: string | null = null,
) {
  return { id, procedimento, numero, status, dataSolicitacao, dataAssinatura }
}

const guias: GuiaDoBeneficiario[] = [
  {
    id: 6, numero: '202610706', ocs: 'Laboratório Exemplo',
    validadeAte: '2026-12-28', dataEnvio: null, situacao: 'NAO_ENVIADA',
    procedimentos: [
      { codDgp: '40304361', descricao: 'Hemograma completo', quantidade: 2 },
      { codDgp: '40301630', descricao: 'Glicose', quantidade: 1 },
    ],
    sessoes: [],
  },
  {
    id: 5, numero: '202610705', ocs: 'Hospital Exemplo',
    validadeAte: '2026-12-20', dataEnvio: '2026-11-02T09:30:00', situacao: 'ENVIADA',
    procedimentos: [{ codDgp: '40302040', descricao: 'Colesterol total', quantidade: 1 }],
    sessoes: [sessao(501, '40302040', 1, 'DISPONIVEL')],
  },
  {
    id: 4, numero: '202610704', ocs: 'Laboratório Exemplo',
    validadeAte: '2026-12-15', dataEnvio: '2026-10-25T14:00:00', situacao: 'EM_EXECUCAO',
    procedimentos: [{ codDgp: '40304361', descricao: 'Hemograma completo', quantidade: 2 }],
    sessoes: [
      sessao(401, '40304361', 1, 'ASSINADA', '2026-10-26T10:00:00', '2026-10-26T10:15:00'),
      sessao(402, '40304361', 2, 'SOLICITADA', '2026-11-01T08:45:00'),
    ],
  },
  {
    id: 3, numero: '202610703', ocs: 'Hospital Exemplo',
    validadeAte: '2026-11-30', dataEnvio: '2026-10-10T11:00:00', situacao: 'REALIZADA',
    procedimentos: [{ codDgp: '40302040', descricao: 'Colesterol total', quantidade: 1 }],
    sessoes: [sessao(301, '40302040', 1, 'ASSINADA', '2026-10-11T09:00:00', '2026-10-11T09:20:00')],
  },
  {
    id: 2, numero: '202610702', ocs: 'Laboratório Exemplo',
    validadeAte: '2026-10-30', dataEnvio: '2026-09-15T10:00:00', situacao: 'ENCERRADA',
    procedimentos: [{ codDgp: '40304361', descricao: 'Hemograma completo', quantidade: 3 }],
    sessoes: [
      sessao(201, '40304361', 1, 'ASSINADA', '2026-09-20T10:00:00', '2026-09-20T10:10:00'),
      sessao(202, '40304361', 2, 'ASSINADA', '2026-10-01T10:00:00', '2026-10-01T10:10:00'),
      sessao(203, '40304361', 3, 'EXPIRADA', '2026-10-20T10:00:00'),
    ],
  },
  {
    id: 1, numero: '202610701', ocs: 'Hospital Exemplo',
    validadeAte: '2026-10-15', dataEnvio: '2026-09-01T10:00:00', situacao: 'VENCIDA',
    procedimentos: [{ codDgp: '40301630', descricao: 'Glicose', quantidade: 1 }],
    sessoes: [sessao(101, '40301630', 1, 'EXPIRADA', '2026-09-05T10:00:00')],
  },
]

// Guia 6 do mock (Não enviada) já atualizada como o backend devolveria após o POST.
function guiaAtualizada(): GuiaDoBeneficiario {
  const base = guias.find((g) => g.id === 6)!
  return {
    ...base,
    situacao: 'ENVIADA',
    dataEnvio: '2026-11-15T10:00:00',
    sessoes: [
      sessao(601, '40304361', 1, 'DISPONIVEL'),
      sessao(602, '40304361', 2, 'DISPONIVEL'),
      sessao(603, '40301630', 1, 'DISPONIVEL'),
    ],
  }
}

// Mock de fetch que responde à lista (GET) e ao envio (POST com sucesso).
function stubbearListaEEnvio(resposta: GuiaDoBeneficiario = guiaAtualizada()) {
  fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    const metodo = init?.method ?? 'GET'
    if (url === '/api/guias/minhas' && metodo === 'GET') {
      return Promise.resolve(respostaJson(guias))
    }
    if (/^\/api\/guias\/\d+\/envio$/.test(url) && metodo === 'POST') {
      return Promise.resolve(respostaJson(resposta))
    }
    return Promise.resolve(new Response('', { status: 404 }))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

// Mock de fetch em que o POST responde 409 (guia já enviada, por exemplo).
function stubbearEnvioComErro() {
  fetchMock = vi.fn().mockImplementation((url: string, init?: RequestInit) => {
    const metodo = init?.method ?? 'GET'
    if (url === '/api/guias/minhas' && metodo === 'GET') {
      return Promise.resolve(respostaJson(guias))
    }
    if (/^\/api\/guias\/\d+\/envio$/.test(url) && metodo === 'POST') {
      return Promise.resolve(
        respostaJson(
          {
            status: 409,
            erro: 'Conflict',
            mensagem: 'Esta guia ja foi enviada à OCS',
            detalhes: [],
            timestamp: '',
          },
          409,
        ),
      )
    }
    return Promise.resolve(new Response('', { status: 404 }))
  })
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const chamadasPost = () =>
  fetchMock.mock.calls.filter(([, init]) => init?.method === 'POST')

let fetchMock: ReturnType<typeof vi.fn>

function stubbearLista(lista: GuiaDoBeneficiario[]) {
  fetchMock = vi.fn().mockResolvedValue(respostaJson(lista))
  vi.stubGlobal('fetch', fetchMock)
  return fetchMock
}

const cartaoDe = (numero: string) => screen.getByLabelText(`Guia nº ${numero}`)

beforeEach(() => {
  localStorage.clear()
  stubbearLista(guias)
})

afterEach(() => {
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('T18-FE-1 · Minhas guias', () => {
  // Estados
  it('mostra o skeleton enquanto carrega e depois os cartões', async () => {
    render(<MinhasGuiasPage />)
    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
    expect(await screen.findByLabelText('Guia nº 202610706')).toBeInTheDocument()
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument()
  })

  it('mostra a mensagem de lista vazia (e não mostra o filtro)', async () => {
    stubbearLista([])
    render(<MinhasGuiasPage />)
    expect(
      await screen.findByText(
        'Você ainda não tem guias. Elas aparecem aqui quando a sua pré-guia estiver concluída.',
      ),
    ).toBeInTheDocument()
    expect(screen.queryByLabelText('Mostrar')).not.toBeInTheDocument()
  })

  it('erro mostra mensagem e "Tentar novamente" recarrega', async () => {
    fetchMock = vi
      .fn()
      .mockRejectedValueOnce(new TypeError('Failed to fetch'))
      .mockResolvedValueOnce(respostaJson(guias))
    vi.stubGlobal('fetch', fetchMock)

    render(<MinhasGuiasPage />)
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar suas guias.')

    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByLabelText('Guia nº 202610706')).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(2)
  })

  // Conteúdo do cartão
  it('chama GET /guias/minhas (sem parâmetros)', async () => {
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610706')

    const url = fetchMock.mock.calls[0][0]
    expect(url).toBe('/api/guias/minhas')
  })

  it('mostra "Guia nº X · OCS" e a validade em todo cartão', async () => {
    render(<MinhasGuiasPage />)
    const cartao = await screen.findByLabelText('Guia nº 202610706')
    expect(
      within(cartao).getByRole('heading', { name: /Guia nº 202610706 · Laboratório Exemplo/ }),
    ).toBeInTheDocument()
    expect(within(cartao).getByText(/Válida até 28\/12\/2026/)).toBeInTheDocument()
  })

  it('"Enviada à OCS em" só aparece quando a guia já foi enviada', async () => {
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610705')

    expect(within(cartaoDe('202610705')).getByText(/Enviada à OCS em 02\/11\/2026/)).toBeInTheDocument()
    expect(within(cartaoDe('202610706')).queryByText(/Enviada à OCS em/)).not.toBeInTheDocument()
  })

  it('lista os procedimentos com codigo, descricao e quantidade', async () => {
    render(<MinhasGuiasPage />)
    const cartao = await screen.findByLabelText('Guia nº 202610706')
    expect(within(cartao).getByText(/40304361 · Hemograma completo · 2 sessões autorizadas/)).toBeInTheDocument()
    expect(within(cartao).getByText(/40301630 · Glicose · 1 sessão autorizada/)).toBeInTheDocument()
  })

  // Situações (badge + texto)
  it.each([
    ['202610706', 'Não enviada', 'Guia pronta. Envie para a OCS para que ela possa solicitar as sessões.'],
    ['202610705', 'Enviada', 'Enviada à OCS. Aguardando a OCS solicitar a assinatura de uma sessão.'],
    ['202610703', 'Realizada', 'Todas as sessões foram assinadas. Não há mais nada a fazer nesta guia.'],
    [
      '202610702',
      'Encerrada',
      'A sua Guia expirou antes de você realizar todas as assinaturas. Será necessário o requerimento de uma nova Guia.',
    ],
    [
      '202610701',
      'Vencida',
      'A sua Guia expirou e você não realizou nenhuma assinatura. Será necessário o requerimento de uma nova Guia.',
    ],
  ])('guia %s mostra badge "%s" e o texto da situação', async (numero, badge, texto) => {
    render(<MinhasGuiasPage />)
    const cartao = await screen.findByLabelText(`Guia nº ${numero}`)
    expect(within(cartao).getByText(badge)).toHaveClass('badge')
    expect(within(cartao).getByText(texto)).toBeInTheDocument()
  })

  it('Em execução: mostra "Assinadas: X de Y. Solicitadas para assinar: Z."', async () => {
    render(<MinhasGuiasPage />)
    const cartao = await screen.findByLabelText('Guia nº 202610704')
    expect(within(cartao).getByText('Assinadas: 1 de 2. Solicitadas para assinar: 1.')).toBeInTheDocument()
  })

  it('Encerrada: mostra os contadores em outra linha', async () => {
    render(<MinhasGuiasPage />)
    const cartao = await screen.findByLabelText('Guia nº 202610702')
    expect(
      within(cartao).getByText('Sessões assinadas: 2. Sessões expiradas (não cobráveis): 1.'),
    ).toBeInTheDocument()
  })

  it('não usa mais as mensagens antigas de "validade venceu"', async () => {
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610701')
    expect(screen.queryByText(/A validade venceu/)).not.toBeInTheDocument()
  })

  // Filtro "Mostrar"
  it('o filtro abre em "Todas" e mostra as seis guias', async () => {
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610706')
    expect(screen.getByLabelText('Mostrar')).toHaveValue('todas')
    expect(screen.getAllByRole('article')).toHaveLength(6)
  })

  it('"Em andamento" filtra e NÃO chama o servidor de novo', async () => {
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610706')
    expect(fetchMock).toHaveBeenCalledTimes(1)

    await userEvent.selectOptions(screen.getByLabelText('Mostrar'), 'em-andamento')

    expect(cartaoDe('202610706')).toBeInTheDocument()
    expect(cartaoDe('202610705')).toBeInTheDocument()
    expect(cartaoDe('202610704')).toBeInTheDocument()
    expect(screen.queryByLabelText('Guia nº 202610703')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Guia nº 202610702')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Guia nº 202610701')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('"Finalizadas" filtra e NÃO chama o servidor de novo', async () => {
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610706')

    await userEvent.selectOptions(screen.getByLabelText('Mostrar'), 'finalizadas')

    expect(cartaoDe('202610703')).toBeInTheDocument()
    expect(cartaoDe('202610702')).toBeInTheDocument()
    expect(cartaoDe('202610701')).toBeInTheDocument()
    expect(screen.queryByLabelText('Guia nº 202610706')).not.toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('"Em andamento" sem itens mostra "Nenhuma guia em andamento."', async () => {
    stubbearLista(guias.filter((g) => g.situacao === 'REALIZADA'))
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610703')
    await userEvent.selectOptions(screen.getByLabelText('Mostrar'), 'em-andamento')
    expect(screen.getByText('Nenhuma guia em andamento.')).toBeInTheDocument()
  })

  it('"Finalizadas" sem itens mostra "Nenhuma guia finalizada."', async () => {
    stubbearLista(guias.filter((g) => g.situacao === 'NAO_ENVIADA'))
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610706')
    await userEvent.selectOptions(screen.getByLabelText('Mostrar'), 'finalizadas')
    expect(screen.getByText('Nenhuma guia finalizada.')).toBeInTheDocument()
  })

  // Escopo (FE-2/3/4 ainda não)
  it('não mostra os botões das próximas tasks (Enviar / Assinar sessões / Ver guia)', async () => {
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610706')
    expect(screen.queryByRole('button', { name: /Assinar sessões/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Ver guia/i })).not.toBeInTheDocument()
  })
})

describe('T18-FE-2 · Enviar guia à OCS', () => {
  it('o botão Enviar para a OCS aparece só em guia Não enviada', async () => {
    stubbearListaEEnvio()
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610706')

    expect(
      within(cartaoDe('202610706')).getByRole('button', { name: 'Enviar para a OCS' }),
    ).toBeInTheDocument()

    for (const numero of ['202610705', '202610704', '202610703', '202610702', '202610701']) {
      expect(
        within(cartaoDe(numero)).queryByRole('button', { name: 'Enviar para a OCS' }),
      ).not.toBeInTheDocument()
    }
  })

  it('clicar em Enviar para a OCS abre a confirmação com os dados da guia', async () => {
    stubbearListaEEnvio()
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610706')

    await userEvent.click(
      within(cartaoDe('202610706')).getByRole('button', { name: 'Enviar para a OCS' }),
    )

    const painel = screen.getByRole('region', { name: 'Confirmação de envio' })
    expect(within(painel).getByText('Enviar a guia nº 202610706 para a OCS?')).toBeInTheDocument()
    expect(within(painel).getByText(/Hemograma completo \(2\) · Glicose \(1\)/)).toBeInTheDocument()
    expect(within(painel).getByText('Laboratório Exemplo')).toBeInTheDocument()
    expect(within(painel).getByText('3')).toBeInTheDocument() // sessões autorizadas
    expect(within(painel).getByRole('button', { name: 'Confirmar envio' })).toBeInTheDocument()
    expect(within(painel).getByRole('button', { name: 'Cancelar' })).toBeInTheDocument()
  })

  it('Cancelar fecha a confirmação sem enviar nada', async () => {
    stubbearListaEEnvio()
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610706')

    await userEvent.click(
      within(cartaoDe('202610706')).getByRole('button', { name: 'Enviar para a OCS' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.queryByRole('region', { name: 'Confirmação de envio' })).not.toBeInTheDocument()
    expect(
      within(cartaoDe('202610706')).getByRole('button', { name: 'Enviar para a OCS' }),
    ).toBeInTheDocument()
    expect(chamadasPost()).toHaveLength(0)
  })

  it('Confirmar envia no endpoint certo, mostra a mensagem e muda o badge para Enviada', async () => {
    stubbearListaEEnvio()
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610706')

    await userEvent.click(
      within(cartaoDe('202610706')).getByRole('button', { name: 'Enviar para a OCS' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar envio' }))

    // Chamada POST no endpoint certo
    const post = chamadasPost()
    expect(post).toHaveLength(1)
    expect(post[0][0]).toBe('/api/guias/6/envio')

    // Mensagem de sucesso
    expect(await screen.findByText('Guia nº 202610706 enviada à OCS')).toBeInTheDocument()

    // Cartão atualizado: badge Enviada, sem botão Enviar, texto novo, linha "Enviada à OCS em"
    const cartao = cartaoDe('202610706')
    expect(within(cartao).getByText('Enviada')).toHaveClass('badge-enviada')
    expect(
      within(cartao).queryByRole('button', { name: 'Enviar para a OCS' }),
    ).not.toBeInTheDocument()
    expect(
      within(cartao).getByText(/Enviada à OCS\. Aguardando a OCS solicitar/),
    ).toBeInTheDocument()
    expect(within(cartao).getByText(/Enviada à OCS em 15\/11\/2026/)).toBeInTheDocument()

    // Painel de confirmação fechou
    expect(screen.queryByRole('region', { name: 'Confirmação de envio' })).not.toBeInTheDocument()
  })

  it('erro no envio mantém a guia Não enviada, mostra a mensagem e o painel permite tentar de novo', async () => {
    stubbearEnvioComErro()
    render(<MinhasGuiasPage />)
    await screen.findByLabelText('Guia nº 202610706')

    await userEvent.click(
      within(cartaoDe('202610706')).getByRole('button', { name: 'Enviar para a OCS' }),
    )
    await userEvent.click(screen.getByRole('button', { name: 'Confirmar envio' }))

    // Mensagem de erro dentro do painel
    const painel = screen.getByRole('region', { name: 'Confirmação de envio' })
    expect(await within(painel).findByRole('alert')).toHaveTextContent(
      'Não foi possível enviar a guia. Tente novamente.',
    )
    // Botão Confirmar volta a ficar habilitado (permite tentar de novo)
    expect(within(painel).getByRole('button', { name: 'Confirmar envio' })).toBeEnabled()

    // Guia continua Não enviada
    const cartao = cartaoDe('202610706')
     expect(within(cartao).getByText('Não enviada')).toHaveClass('badge-nao-enviada')
     expect(
      within(cartao).queryByRole('button', { name: 'Enviar para a OCS' }),
    ).not.toBeInTheDocument()

  })
})