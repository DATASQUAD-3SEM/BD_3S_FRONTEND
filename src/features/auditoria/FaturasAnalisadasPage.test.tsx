import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import FaturasAnalisadasPage from './FaturasAnalisadasPage'
import type { AuditoriaApi, FaturaAnalisadaResumo } from './types'

const analisada: FaturaAnalisadaResumo = {
  id: 6,
  ocs: 'Laboratorio Exemplo',
  numeroFatura: '006/2026',
  dataEntrada: '2026-09-30T09:00:00',
  dataVisualizacao: '2026-10-05T10:00:00',
  responsavelVisualizacao: 'Sd Almeida',
  valorInformado: 1000,
  valorGlosa: 120,
  valorFinal: 880,
}

function apiCom(listarAnalisadas: AuditoriaApi['listarAnalisadas']): AuditoriaApi {
  return { listarFaturas: vi.fn(), listarAnalisadas, detalhar: vi.fn(), obterPdfGuia: vi.fn(), visualizar: vi.fn() }
}

function renderizar(api: AuditoriaApi) {
  return render(
    <MemoryRouter>
      <FaturasAnalisadasPage api={api} />
    </MemoryRouter>,
  )
}

describe('FaturasAnalisadasPage (T26-FE4)', () => {
  it('mostra quem visualizou, quando e os valores de cada fatura', async () => {
    renderizar(apiCom(vi.fn().mockResolvedValue([analisada])))

    expect(await screen.findByText('Fatura nº 006/2026 · Laboratorio Exemplo')).toBeInTheDocument()
    expect(screen.getByText(/Visualizada em .* por Sd Almeida/)).toBeInTheDocument()
    expect(screen.getByText(/Final: R\$\s?880,00/)).toBeInTheDocument()
  })

  it('o cartão leva à visualização informando a origem analisadas', async () => {
    renderizar(apiCom(vi.fn().mockResolvedValue([analisada])))

    expect(await screen.findByRole('link', { name: /Fatura nº 006\/2026/ })).toHaveAttribute(
      'href',
      '/auditoria/faturas/6',
    )
  })

  it('lista vazia mostra a mensagem própria', async () => {
    renderizar(apiCom(vi.fn().mockResolvedValue([])))

    expect(await screen.findByText('Nenhuma fatura analisada ainda.')).toBeInTheDocument()
  })

  it('erro ao carregar mostra a mensagem', async () => {
    renderizar(apiCom(vi.fn().mockRejectedValue(new Error('falhou'))))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as faturas.')
  })
})
