import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom/vitest'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it, vi } from 'vitest'
import type { VersoFatura, VersosApi } from './api'
import VersosFaturasPage from './VersosFaturasPage'

/** T32-FE1: lista de faturas com versos das Guias glosadas. */

const faturas: VersoFatura[] = [
  { faturaId: 5, numeroFatura: '005/2026', ocs: 'Laboratorio Exemplo', situacao: 'EM_AUDITORIA', guiasGlosadas: 2, valorGlosa: 50 },
  { faturaId: 6, numeroFatura: '006/2026', ocs: 'Hospital Exemplo', situacao: 'AUDITADA', guiasGlosadas: 1, valorGlosa: 20 },
]

function api(listar = vi.fn().mockResolvedValue(faturas)): VersosApi {
  return { listar, detalhar: vi.fn(), pdfDaGuia: vi.fn(), pdfDaFatura: vi.fn() }
}

function renderizar(a: VersosApi) {
  return render(
    <MemoryRouter>
      <VersosFaturasPage api={a} />
    </MemoryRouter>,
  )
}

describe('VersosFaturasPage (T32-FE1)', () => {
  it('um cartão por fatura com o resumo das Guias glosadas e o link para as Guias', async () => {
    renderizar(api())

    const link = await screen.findByRole('link', { name: /Fatura nº 005\/2026 · Laboratorio Exemplo/ })
    expect(link).toHaveAttribute('href', '/rastreabilidade/versos/5')
    expect(screen.getByText('2 Guia(s) glosada(s) · Glosa: R$ 50,00')).toBeInTheDocument()
  })

  it('filtra por OCS na tela', async () => {
    renderizar(api())
    await screen.findByRole('link', { name: /005\/2026/ })

    fireEvent.change(screen.getByLabelText('OCS'), { target: { value: 'Hospital Exemplo' } })

    expect(screen.queryByRole('link', { name: /005\/2026/ })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /006\/2026/ })).toBeInTheDocument()
  })

  it('vazio e erro', async () => {
    const { unmount } = renderizar(api(vi.fn().mockResolvedValue([])))
    expect(await screen.findByText('Nenhuma Guia glosada com verso para imprimir.')).toBeInTheDocument()
    unmount()

    renderizar(api(vi.fn().mockRejectedValue(new Error('x'))))
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar os versos.')
  })
})
