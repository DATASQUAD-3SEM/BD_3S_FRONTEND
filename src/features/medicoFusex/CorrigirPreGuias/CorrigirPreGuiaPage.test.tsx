import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CorrigirPreGuiaPage from './CorrigirPreGuiaPage'
import { correcaoMock } from './correcaoApi.mock'
import type { CorrecaoApi } from './correcaoTipos'

/**
 * Testes da tela Corrigir pre-guia {numero} (T14-FE2): carregamento, redirecionamentos, 404, 409 e salvamento.
 */

function apiCom(parcial: Partial<CorrecaoApi>): CorrecaoApi {
  return { ...correcaoMock, ...parcial }
}

function renderizar(api: CorrecaoApi) {
  return render(
    <MemoryRouter initialEntries={['/medico/corrigir-pre-guias/405']}>
      <Routes>
        <Route path="/medico/corrigir-pre-guias" element={<p>Lista de correção</p>} />
        <Route path="/medico/corrigir-pre-guias/:id" element={<CorrigirPreGuiaPage api={api} />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CorrigirPreGuiaPage', () => {
  it('mostra título, observação, beneficiário somente leitura, OCS e exames', async () => {
    renderizar(correcaoMock)

    expect(await screen.findByRole('heading', { name: 'Corrigir pré-guia 0405' })).toBeInTheDocument()
    expect(screen.getByText('Registrada em 11/10/2026')).toBeInTheDocument()
    expect(screen.getByText('Marta Souza Lima')).toBeInTheDocument()
    expect(screen.getByText('458100200-01')).toBeInTheDocument()
    expect(
      screen.getByText('OCS selecionada · Laboratório Exemplo · EXEMPLO-001 · LABORATÓRIO'),
    ).toBeInTheDocument()
    expect(screen.getByText('Hemograma completo')).toBeInTheDocument()
    expect(screen.getByText('Glicose')).toBeInTheDocument()
  })

  it('redireciona para a lista quando a pré-guia não está em Atenção', async () => {
    renderizar(
      apiCom({
        detalhar: async (id) => ({ ...(await correcaoMock.detalhar(id)), status: 'PENDENTE' }),
      }),
    )

    expect(await screen.findByText('Lista de correção')).toBeInTheDocument()
  })

  it('mostra pré-guia não encontrada quando a API responde 404', async () => {
    renderizar(
      apiCom({
        detalhar: () => Promise.reject(Object.assign(new Error('Erro 404'), { status: 404 })),
      }),
    )

    expect(await screen.findByText('Pré-guia não encontrada')).toBeInTheDocument()
  })

  it('não permite remover o último exame', async () => {
    renderizar(correcaoMock)

    const botoes = await screen.findAllByRole('button', { name: 'Remover' })
    fireEvent.click(botoes[1])

    expect(screen.getByRole('button', { name: 'Remover' })).toBeDisabled()
  })

  it('envia só os exames quando a OCS não muda e bloqueia o duplo clique', async () => {
    const salvar = vi.fn(async () => ({
      status: 'PENDENTE',
      dataReenvio: '2026-10-25T10:00:00',
    }))
    renderizar(apiCom({ salvarCorrecao: salvar }))

    const botoes = await screen.findAllByRole('button', { name: 'Remover' })
    fireEvent.click(botoes[1])

    const salvarBotao = screen.getByRole('button', { name: 'Salvar correção e reenviar' })
    fireEvent.click(salvarBotao)
    fireEvent.click(salvarBotao)

    expect(await screen.findByText('Lista de correção')).toBeInTheDocument()
    expect(salvar).toHaveBeenCalledTimes(1)
    expect(salvar).toHaveBeenCalledWith(405, { procedimentos: ['40304361'] })
  })

  it('mostra o aviso de pré-guia já alterada quando a API responde 409', async () => {
    renderizar(
      apiCom({
        salvarCorrecao: () => Promise.reject(Object.assign(new Error('Erro 409'), { status: 409 })),
      }),
    )

    expect(await screen.findByRole('heading', { name: 'Corrigir pré-guia 0405' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Salvar correção e reenviar' }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Esta pré-guia já foi alterada. Atualize a lista e confira a situação atual.',
    )
  })

  it('só consulta a API de exames com 2 ou mais caracteres', async () => {
    const buscarProcedimentos = vi.fn(correcaoMock.buscarProcedimentos)
    renderizar(apiCom({ buscarProcedimentos }))

    const campo = await screen.findByLabelText('Buscar por nome ou código TUSS')
    fireEvent.change(campo, { target: { value: 'g' } })
    fireEvent.change(campo, { target: { value: 'gl' } })

    await waitFor(() => expect(buscarProcedimentos).toHaveBeenCalledWith('gl'))
    expect(buscarProcedimentos).not.toHaveBeenCalledWith('g')
  })
})
