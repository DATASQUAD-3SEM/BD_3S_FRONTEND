import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import SelecaoOcs from './SelecaoOcs'

/**
 * Testes da escolha de OCS da Nova pre-guia do beneficiario (busca no servidor com debounce).
 */

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
}

afterEach(() => vi.unstubAllGlobals())

const ocs1 = { id: 1, contrato: 'EXEMPLO-001', nome: 'Laboratorio Exemplo', tipo: 'OCS' }
const ocs2 = { id: 2, contrato: 'EXEMPLO-002', nome: 'Hospital Exemplo', tipo: 'PSA' }

describe('SelecaoOcs', () => {
  it('mostra a lista inicial de OCS com contrato e tipo', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson([ocs1, ocs2])))
    render(<SelecaoOcs value={null} onChange={vi.fn()} />)

    expect(await screen.findByText('Laboratorio Exemplo')).toBeInTheDocument()
    expect(screen.getByText('Hospital Exemplo')).toBeInTheDocument()
    expect(screen.getByText('Contrato: EXEMPLO-002 · PSA')).toBeInTheDocument()
  })

  it('busca no servidor pelo termo digitado', async () => {
    const fetchMock = vi.fn().mockImplementation((url: string) =>
      Promise.resolve(respostaJson(url.includes('busca=hosp') ? [ocs2] : [ocs1, ocs2])),
    )
    vi.stubGlobal('fetch', fetchMock)
    render(<SelecaoOcs value={null} onChange={vi.fn()} />)

    await screen.findByText('Laboratorio Exemplo')
    fireEvent.change(screen.getByLabelText(/Buscar OCS/), { target: { value: 'hosp' } })

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/beneficiarios/me/ocs?busca=hosp', expect.anything()),
    )
    expect(await screen.findByText('Hospital Exemplo')).toBeInTheDocument()
    expect(screen.queryByText('Laboratorio Exemplo')).not.toBeInTheDocument()
  })

  it('avisa o container com a OCS escolhida', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson([ocs1])))
    const onChange = vi.fn()
    render(<SelecaoOcs value={null} onChange={onChange} />)

    fireEvent.click(await screen.findByRole('radio'))

    expect(onChange).toHaveBeenCalledWith(ocs1)
  })

  it('mostra erro quando a API falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    render(<SelecaoOcs value={null} onChange={vi.fn()} />)

    expect(await screen.findByText(/Nao foi possivel carregar/i)).toBeInTheDocument()
  })

  it('marca como selecionada a OCS que ja estava no value', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson([ocs1, ocs2])))
    render(<SelecaoOcs value={ocs2} onChange={vi.fn()} />)

    const radios = await screen.findAllByRole('radio')
    expect(radios[1]).toBeChecked()
    expect(screen.getByRole('status')).toHaveTextContent('OCS selecionada: Hospital Exemplo')
  })
})
