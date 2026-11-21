import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api/http'
import EnviarRastreabilidade from './EnviarRastreabilidade'

describe('EnviarRastreabilidade (T24-FE3)', () => {
  it('só abre o formulário ao clicar na ação', async () => {
    const user = userEvent.setup()
    render(<EnviarRastreabilidade onEnviar={vi.fn()} />)

    expect(screen.queryByLabelText('Responsável pelo envio')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Enviar para a rastreabilidade' }))
    expect(screen.getByLabelText('Responsável pelo envio')).toBeInTheDocument()
  })

  it('mantém "Confirmar envio" desabilitado com responsável curto', async () => {
    const user = userEvent.setup()
    render(<EnviarRastreabilidade onEnviar={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Enviar para a rastreabilidade' }))

    await user.type(screen.getByLabelText('Responsável pelo envio'), '  Al  ')
    expect(screen.getByRole('button', { name: 'Confirmar envio' })).toBeDisabled()
  })

  it('envia o responsável sem espaços nas pontas', async () => {
    const user = userEvent.setup()
    const onEnviar = vi.fn().mockResolvedValue(undefined)
    render(<EnviarRastreabilidade onEnviar={onEnviar} />)
    await user.click(screen.getByRole('button', { name: 'Enviar para a rastreabilidade' }))

    await user.type(screen.getByLabelText('Responsável pelo envio'), '  Sd Almeida  ')
    await user.click(screen.getByRole('button', { name: 'Confirmar envio' }))

    expect(onEnviar).toHaveBeenCalledWith('Sd Almeida')
  })

  it('mostra o erro do servidor e mantém o formulário aberto', async () => {
    const user = userEvent.setup()
    render(
      <EnviarRastreabilidade
        onEnviar={vi.fn().mockRejectedValue(new ApiError(409, 'Esta acao nao e permitida na situacao atual da fatura'))}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Enviar para a rastreabilidade' }))
    await user.type(screen.getByLabelText('Responsável pelo envio'), 'Sd Almeida')
    await user.click(screen.getByRole('button', { name: 'Confirmar envio' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Esta acao nao e permitida')
    expect(screen.getByRole('form', { name: 'Enviar para a rastreabilidade' })).toBeInTheDocument()
  })
})
