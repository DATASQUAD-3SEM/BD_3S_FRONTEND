import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api/http'
import ProtocolarFatura from './ProtocolarFatura'

function renderizar(overrides: Partial<Parameters<typeof ProtocolarFatura>[0]> = {}) {
  const props = {
    dataEntrada: '2026-11-02T09:00:00',
    ocs: 'Laboratorio Exemplo',
    numeroSugerido: '007/2026',
    onSalvar: vi.fn().mockResolvedValue(undefined),
    onCancelar: vi.fn(),
    ...overrides,
  }
  render(<ProtocolarFatura {...props} />)
  return props
}

describe('ProtocolarFatura (T24-FE2)', () => {
  it('traz o nº sugerido e mantém data de entrada e OCS só de leitura', () => {
    renderizar()

    expect(screen.getByLabelText('Nº da Fatura')).toHaveValue('007/2026')
    expect(screen.getByLabelText('OCS/PSA')).toHaveAttribute('readonly')
    expect(screen.getByLabelText('Data de Entrada')).toHaveAttribute('readonly')
  })

  it('mantém "Salvar protocolo" desabilitado sem responsável com 3 caracteres', async () => {
    const user = userEvent.setup()
    renderizar()
    const salvar = screen.getByRole('button', { name: 'Salvar protocolo' })

    expect(salvar).toBeDisabled()
    await user.type(screen.getByLabelText('Responsável (seu nome)'), 'Al')
    expect(salvar).toBeDisabled()
  })

  it('recusa nº fora do formato XXX/XXXX', async () => {
    const user = userEvent.setup()
    renderizar()
    const numero = screen.getByLabelText('Nº da Fatura')

    await user.clear(numero)
    await user.type(numero, '7/2026')
    await user.type(screen.getByLabelText('Responsável (seu nome)'), 'Sd Almeida')

    expect(screen.getByRole('button', { name: 'Salvar protocolo' })).toBeDisabled()
  })

  it('envia nº e responsável já sem espaços nas pontas', async () => {
    const user = userEvent.setup()
    const { onSalvar } = renderizar()

    await user.type(screen.getByLabelText('Responsável (seu nome)'), '  Sd Almeida  ')
    await user.click(screen.getByRole('button', { name: 'Salvar protocolo' }))

    expect(onSalvar).toHaveBeenCalledWith('007/2026', 'Sd Almeida')
  })

  it('mostra o erro do servidor e mantém o formulário aberto', async () => {
    const user = userEvent.setup()
    renderizar({
      onSalvar: vi.fn().mockRejectedValue(new ApiError(409, 'Já existe uma fatura desta OCS com este número.')),
    })

    await user.type(screen.getByLabelText('Responsável (seu nome)'), 'Sd Almeida')
    await user.click(screen.getByRole('button', { name: 'Salvar protocolo' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe uma fatura desta OCS com este número.')
    expect(screen.getByRole('form', { name: 'Protocolar fatura' })).toBeInTheDocument()
  })
})
