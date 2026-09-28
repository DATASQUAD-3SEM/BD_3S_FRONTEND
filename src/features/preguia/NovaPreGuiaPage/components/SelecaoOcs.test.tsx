import { afterEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import SelecaoOcs from './SelecaoOcs'

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => vi.unstubAllGlobals())

const ocs1 = {
  id: 1,
  contratoNum: 'C1',
  nome: 'Laboratorio Exemplo',
  tipo: 'LABORATORIO',
  inicioVigencia: '2026-01-01',
  terminoVigencia: '2027-01-01',
  diasParaVencimento: 100,
}
const ocs2 = {
  id: 2,
  contratoNum: 'C2',
  nome: 'Hospital Exemplo',
  tipo: 'HOSPITAL',
  inicioVigencia: '2026-01-01',
  terminoVigencia: '2027-06-01',
  diasParaVencimento: 250,
}

describe('SelecaoOcs', () => {
  it('mostra as OCS depois de carregar', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson([ocs1, ocs2])))
    render(<SelecaoOcs value={null} onChange={vi.fn()} />)

    expect(await screen.findByText('Laboratorio Exemplo')).toBeInTheDocument()
    expect(screen.getByText('Hospital Exemplo')).toBeInTheDocument()
  })

  it('filtra pelo termo de busca', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson([ocs1, ocs2])))
    render(<SelecaoOcs value={null} onChange={vi.fn()} />)

    await screen.findByText('Laboratorio Exemplo')
    fireEvent.change(screen.getByLabelText(/Buscar OCS/), { target: { value: 'hospital' } })

    expect(screen.queryByText('Laboratorio Exemplo')).not.toBeInTheDocument()
    expect(screen.getByText('Hospital Exemplo')).toBeInTheDocument()
  })

  it('avisa o container quando uma OCS e escolhida', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson([ocs1])))
    const onChange = vi.fn()
    render(<SelecaoOcs value={null} onChange={onChange} />)

    fireEvent.click(await screen.findByRole('radio'))

    expect(onChange).toHaveBeenCalledWith(1)
  })

  it('mostra erro quando a API falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))
    render(<SelecaoOcs value={null} onChange={vi.fn()} />)

    expect(await screen.findByText(/Nao foi possivel carregar/i)).toBeInTheDocument()
  })

  it('marca como selecionada a OCS que ja estava no value', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson([ocs1, ocs2])))
    render(<SelecaoOcs value={2} onChange={vi.fn()} />)

    const radios = await screen.findAllByRole('radio')
    expect(radios[1]).toBeChecked()
  })
})
