import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ApiError } from '../../../shared/api/http'
import EnviarRastreabilidade from './EnviarRastreabilidade'

describe('EnviarRastreabilidade (T24-FE3)', () => {
  it('só abre o formulário ao clicar na ação', async () => {
    const user = userEvent.setup()
    render(<EnviarRastreabilidade numeroFatura="003/2026" onEnviar={vi.fn()} />)

    expect(screen.queryByLabelText('Responsável (seu nome)')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Enviar para a rastreabilidade' }))
    expect(screen.getByLabelText('Responsável (seu nome)')).toBeInTheDocument()
  })

  it('mantém "Sim, enviar para a rastreabilidade" desabilitado com responsável curto', async () => {
    const user = userEvent.setup()
    render(<EnviarRastreabilidade numeroFatura="003/2026" onEnviar={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Enviar para a rastreabilidade' }))

    await user.type(screen.getByLabelText('Responsável (seu nome)'), '  Al  ')
    expect(screen.getByRole('button', { name: 'Sim, enviar para a rastreabilidade' })).toBeDisabled()
  })

  it('abre o painel de confirmação com o título, o texto com o nº da fatura e os botões', async () => {
    const user = userEvent.setup()
    render(<EnviarRastreabilidade numeroFatura="003/2026" onEnviar={vi.fn()} />)
    await user.click(screen.getByRole('button', { name: 'Enviar para a rastreabilidade' }))

    expect(screen.getByRole('heading', { name: 'Confirmar envio para a rastreabilidade' })).toBeInTheDocument()
    expect(
      screen.getByText(
        'Depois de enviada, a fatura nº 003/2026 segue para a lisura e não pode mais ser alterada neste setor. Tem certeza que deseja enviar?',
      ),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sim, enviar para a rastreabilidade' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'Cancelar' })).toBeEnabled()
  })

  it('envia o responsável sem espaços nas pontas', async () => {
    const user = userEvent.setup()
    const onEnviar = vi.fn().mockResolvedValue(undefined)
    render(<EnviarRastreabilidade numeroFatura="003/2026" onEnviar={onEnviar} />)
    await user.click(screen.getByRole('button', { name: 'Enviar para a rastreabilidade' }))

    await user.type(screen.getByLabelText('Responsável (seu nome)'), '  Sd Almeida  ')
    await user.click(screen.getByRole('button', { name: 'Sim, enviar para a rastreabilidade' }))

    expect(onEnviar).toHaveBeenCalledWith('Sd Almeida')
  })

  it('mostra o erro do servidor e mantém o formulário aberto', async () => {
    const user = userEvent.setup()
    render(
      <EnviarRastreabilidade
        numeroFatura="003/2026"
        onEnviar={vi.fn().mockRejectedValue(new ApiError(409, 'Esta acao nao e permitida na situacao atual da fatura'))}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Enviar para a rastreabilidade' }))
    await user.type(screen.getByLabelText('Responsável (seu nome)'), 'Sd Almeida')
    await user.click(screen.getByRole('button', { name: 'Sim, enviar para a rastreabilidade' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Esta acao nao e permitida')
    expect(screen.getByRole('form', { name: 'Confirmar envio para a rastreabilidade' })).toBeInTheDocument()
  })
})
