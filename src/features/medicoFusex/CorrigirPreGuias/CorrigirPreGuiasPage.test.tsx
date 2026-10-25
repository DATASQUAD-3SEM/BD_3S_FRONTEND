import { describe, it, expect } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import CorrigirPreGuiasPage from './CorrigirPreGuiasPage'
import { corrigirPreGuiasMock } from './corrigirPreGuiasApi.mock'
import type { CorrigirPreGuiasApi } from './types'

function renderizar(api: CorrigirPreGuiasApi) {
  return render(
    <MemoryRouter initialEntries={['/medico/corrigir-pre-guias']}>
      <Routes>
        <Route path="/medico/corrigir-pre-guias" element={<CorrigirPreGuiasPage api={api} />} />
        <Route path="/medico/corrigir-pre-guias/:id" element={<p>Tela de correção</p>} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('CorrigirPreGuiasPage', () => {
  it('lista as pré-guias devolvidas com observação, linha de detalhes e badge Atenção', async () => {
    renderizar(corrigirPreGuiasMock)

    expect(await screen.findByText('Pré-guia 0405 · Marta Souza Lima')).toBeInTheDocument()
    expect(screen.getByText(/Prec CP 458100200-01 · Laboratório Exemplo/)).toBeInTheDocument()
    expect(screen.getByText(/criada por você em 08\/10\/2026/)).toBeInTheDocument()
    expect(
      screen.getByText('Hemograma completo informado em duplicidade. Favor revisar a lista de exames.'),
    ).toBeInTheDocument()
    expect(screen.getAllByText('Atenção')).toHaveLength(2)
  })

  it('mostra o estado de carregamento enquanto a lista não chega', () => {
    const api: CorrigirPreGuiasApi = { listarParaCorrigir: () => new Promise(() => {}) }
    renderizar(api)

    expect(screen.getByTestId('skeleton')).toBeInTheDocument()
  })

  it('mostra o cartão de lista vazia quando não há pendências', async () => {
    const api: CorrigirPreGuiasApi = { listarParaCorrigir: () => Promise.resolve([]) }
    renderizar(api)

    expect(await screen.findByText('Nenhuma pré-guia para corrigir')).toBeInTheDocument()
    expect(
      screen.getByText('Quando o setor de Guias devolver uma pré-guia sua, ela aparecerá aqui.'),
    ).toBeInTheDocument()
  })

  it('mostra erro e tenta de novo ao clicar em "Tentar novamente"', async () => {
    let chamadas = 0
    const api: CorrigirPreGuiasApi = {
      listarParaCorrigir() {
        chamadas += 1
        return chamadas === 1
          ? Promise.reject(new Error('falha'))
          : corrigirPreGuiasMock.listarParaCorrigir()
      },
    }
    renderizar(api)

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Não foi possível carregar as pré-guias para correção.',
    )
    fireEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }))

    expect(await screen.findByText('Pré-guia 0405 · Marta Souza Lima')).toBeInTheDocument()
    expect(chamadas).toBe(2)
  })

  it('navega para a tela de correção ao clicar em "Corrigir"', async () => {
    renderizar(corrigirPreGuiasMock)

    const botoes = await screen.findAllByRole('button', { name: 'Corrigir' })
    fireEvent.click(botoes[0])

    expect(await screen.findByText('Tela de correção')).toBeInTheDocument()
  })
})
