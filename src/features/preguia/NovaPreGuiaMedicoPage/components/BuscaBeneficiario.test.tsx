import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import BuscaBeneficiario from './BuscaBeneficiario'
import { buscarBeneficiarioPorPrecCp } from '../../../medicos/api'
import type { BeneficiarioEncontrado } from '../../../medicos/types'

vi.mock('../../../medicos/api', () => ({ buscarBeneficiarioPorPrecCp: vi.fn() }))

const achado: BeneficiarioEncontrado = {
  id: 1,
  dados: { nome: 'Carlos Menezes', idade: '48', precCp: '12345678900', cpf: '98765432100', telefone: '(12) 99123-4567' },
}

beforeEach(() => {
  vi.mocked(buscarBeneficiarioPorPrecCp).mockReset()
})

describe('BuscaBeneficiario', () => {
  it('botão de buscar fica desabilitado sem Prec-CP', () => {
    render(<BuscaBeneficiario value={null} onChange={vi.fn()} />)
    expect(screen.getByRole('button', { name: /Buscar beneficiário/ })).toBeDisabled()
  })

  it('beneficiário encontrado avisa o container', async () => {
    vi.mocked(buscarBeneficiarioPorPrecCp).mockResolvedValue(achado)
    const onChange = vi.fn()
    render(<BuscaBeneficiario value={null} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText(/Prec-CP do beneficiário/), { target: { value: '12345678900' } })
    fireEvent.click(screen.getByRole('button', { name: /Buscar beneficiário/ }))

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith(achado))
    expect(buscarBeneficiarioPorPrecCp).toHaveBeenCalledWith('12345678900')
  })

  it('Prec-CP inexistente mostra erro e não avisa o container', async () => {
    vi.mocked(buscarBeneficiarioPorPrecCp).mockResolvedValue(null)
    const onChange = vi.fn()
    render(<BuscaBeneficiario value={null} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText(/Prec-CP do beneficiário/), { target: { value: '999' } })
    fireEvent.click(screen.getByRole('button', { name: /Buscar beneficiário/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(/Nenhum beneficiário ativo/)
    expect(onChange).not.toHaveBeenCalled()
  })

  it('com beneficiário: mostra os dados e "Trocar beneficiário" limpa', () => {
    const onChange = vi.fn()
    render(<BuscaBeneficiario value={achado} onChange={onChange} />)

    expect(screen.getByText('Carlos Menezes')).toBeInTheDocument()
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /Trocar beneficiário/ }))
    expect(onChange).toHaveBeenCalledWith(null)
  })
})
