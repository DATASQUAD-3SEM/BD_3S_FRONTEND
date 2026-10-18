import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import NovaPreGuiaMedicoPage from '.'
import { buscarBeneficiarioPorPrecCp, buscarProcedimentos, criarPreGuiaMedico } from '../../medico/api'

vi.mock('../../medicos/api', () => ({
  buscarBeneficiarioPorPrecCp: vi.fn(),
  buscarProcedimentos: vi.fn(),
  criarPreGuiaMedico: vi.fn(),
}))

const ocs = {
  id: 1, contratoNum: 'C1', nome: 'Clinica Exemplo', tipo: 'OCS',
  inicioVigencia: '2026-01-01', terminoVigencia: '2027-01-01', diasParaVencimento: 100,
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation(() =>
      Promise.resolve(
        new Response(JSON.stringify([ocs]), { status: 200, headers: { 'Content-Type': 'application/json' } }),
      ),
    ),
  )
})
afterEach(() => vi.unstubAllGlobals())

describe('NovaPreGuiaMedicoPage', () => {
  it('começa com envio bloqueado e lista o que falta', async () => {
    render(<NovaPreGuiaMedicoPage />)

    expect(screen.getByText('Maj Med Helena Duarte Quintanilha')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Enviar pré-guia/ })).toBeDisabled()
    expect(screen.getByRole('status')).toHaveTextContent(/falta preencher:.*beneficiário.*OCS.*procedimento/)
    expect(screen.queryByLabelText(/arquivo do encaminhamento/i)).not.toBeInTheDocument()

    await screen.findByText('Clinica Exemplo', { selector: 'strong' })
  })

  it('fluxo completo: beneficiário + OCS + procedimento habilita e envia', async () => {
    vi.mocked(buscarBeneficiarioPorPrecCp).mockResolvedValue({
      id: 7,
      dados: { nome: 'Carlos Menezes', idade: '48', precCp: '12345678900', cpf: '98765432100', telefone: '1299' },
    })
    vi.mocked(buscarProcedimentos).mockResolvedValue([
      { id: 3, codigoTuss: '40304361', terminologiaProcedimento: 'Hemograma completo', rolAns: 'SIM', subgrupo: 'Hematologia' },
    ])
    vi.mocked(criarPreGuiaMedico).mockResolvedValue({ id: 77, status: 'PENDENTE' })

    render(<NovaPreGuiaMedicoPage />)

    fireEvent.change(screen.getByLabelText(/Prec-CP do beneficiário/), { target: { value: '12345678900' } })
    fireEvent.click(screen.getByRole('button', { name: /Buscar beneficiário/ }))
    await screen.findByRole('button', { name: /Trocar beneficiário/ })

    fireEvent.click(await screen.findByRole('radio'))

    fireEvent.change(screen.getByLabelText(/Buscar procedimento/), { target: { value: 'hemo' } })
    fireEvent.click(await screen.findByRole('button', { name: /Adicionar Hemograma completo/ }))

    const enviar = screen.getByRole('button', { name: /Enviar pré-guia/ })
    expect(enviar).toBeEnabled()
    fireEvent.click(enviar)

    expect(await screen.findByText('Pré-guia 77 enviada!')).toBeInTheDocument()
    expect(criarPreGuiaMedico).toHaveBeenCalledWith({ beneficiarioId: 7, ocsId: 1, procedimentoIds: [3] })
    expect(screen.getByRole('button', { name: /Enviar pré-guia/ })).toBeDisabled()
  })
})
