import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeAll, describe, expect, it, vi } from 'vitest'
import type { VersoFaturaDetalhe, VersosApi } from './api'
import VersosGuiasFaturaPage from './VersosGuiasFaturaPage'

/** T32-FE2: Guias glosadas da fatura e impressão do verso de uma Guia ou de todas. */

const detalhe: VersoFaturaDetalhe = {
  faturaId: 5,
  numeroFatura: '005/2026',
  ocs: 'Laboratorio Exemplo',
  guias: [
    { guiaId: 10, guiaNumero: '202610690', paciente: 'Ana Lima', situacaoFinal: 'ACEITA_PELA_OCS', seloFinal: 'Aceita pela OCS', glosa: 20 },
    { guiaId: 11, guiaNumero: '202610691', paciente: 'Miguel Ferreira', situacaoFinal: 'PRAZO_VENCIDO', seloFinal: 'Prazo vencido', glosa: 30 },
  ],
}

beforeAll(() => {
  // jsdom não tem URL.createObjectURL: o visualizador de PDF usa para mostrar o arquivo.
  if (!URL.createObjectURL) URL.createObjectURL = vi.fn(() => 'blob:verso')
  if (!URL.revokeObjectURL) URL.revokeObjectURL = vi.fn()
})

function criarApi(detalhar = vi.fn().mockResolvedValue(detalhe)) {
  return {
    listar: vi.fn(),
    detalhar,
    pdfDaGuia: vi.fn().mockResolvedValue(new Blob(['%PDF'], { type: 'application/pdf' })),
    pdfDaFatura: vi.fn().mockResolvedValue(new Blob(['%PDF'], { type: 'application/pdf' })),
  } satisfies VersosApi
}

function renderizar(api: VersosApi) {
  return render(
    <MemoryRouter initialEntries={['/rastreabilidade/versos/5']}>
      <Routes>
        <Route path="/rastreabilidade/versos/:id" element={<VersosGuiasFaturaPage api={api} />} />
      </Routes>
    </MemoryRouter>,
  )
}

describe('VersosGuiasFaturaPage (T32-FE2)', () => {
  it('mostra o aviso fixo e uma linha por Guia glosada com o selo final', async () => {
    renderizar(criarApi())

    expect(await screen.findByRole('heading', { name: 'Fatura nº 005/2026 · Laboratorio Exemplo' })).toBeInTheDocument()
    expect(screen.getByText(/Coloque uma folha A4 em branco na impressora/)).toBeInTheDocument()
    expect(screen.getByText('Aceita pela OCS')).toBeInTheDocument()
    expect(screen.getByText('Prazo vencido')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Imprimir todos os versos (2)' })).toBeInTheDocument()
  })

  it('"Imprimir verso" busca o PDF daquela Guia e "Imprimir todos" o PDF da fatura', async () => {
    const api = criarApi()
    renderizar(api)

    fireEvent.click(await screen.findByRole('button', { name: 'Imprimir verso da Guia 202610691' }))
    await waitFor(() => expect(api.pdfDaGuia).toHaveBeenCalledWith(5, 11))

    fireEvent.click(screen.getByRole('button', { name: 'Imprimir todos os versos (2)' }))
    await waitFor(() => expect(api.pdfDaFatura).toHaveBeenCalledWith(5))
  })

  it('erro ao carregar mostra a mensagem', async () => {
    renderizar(criarApi(vi.fn().mockRejectedValue(new Error('x'))))

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as Guias da fatura.')
  })
})
