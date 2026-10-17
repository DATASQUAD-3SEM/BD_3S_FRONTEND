import { beforeEach, describe, expect, it } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import { BeneficiarioProvider } from './BeneficiarioContext'
import MinhasInformacoesPage from './BeneficiarioMyInfoPage'
import { reiniciarEstadoMock } from './dadosBeneficiario'

const ESPERA = { timeout: 3000 }

function renderizarPagina() {
  return render(
    <BeneficiarioProvider>
      <MinhasInformacoesPage />
    </BeneficiarioProvider>,
  )
}

function preencherSenha(atual: string, nova: string, confirmacao: string) {
  fireEvent.change(screen.getByLabelText('Senha atual'), { target: { value: atual } })
  fireEvent.change(screen.getByLabelText('Nova senha'), { target: { value: nova } })
  fireEvent.change(screen.getByLabelText('Confirmar nova senha'), { target: { value: confirmacao } })
  fireEvent.click(screen.getByRole('button', { name: 'Alterar senha' }))
}

beforeEach(() => reiniciarEstadoMock())

describe('Minhas informações (com mock)', () => {
  it('salva o telefone, mostra sucesso e desabilita o botão de novo', async () => {
    renderizarPagina()
    await screen.findByLabelText('Telefone', {}, ESPERA)

    fireEvent.change(screen.getByLabelText('Telefone'), { target: { value: '(12) 91111-2222' } })
    fireEvent.click(screen.getByRole('button', { name: 'Salvar telefone' }))

    expect(await screen.findByText('Telefone salvo com sucesso.', {}, ESPERA)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Salvar telefone' })).toBeDisabled()
  })

  it('senha atual errada mostra erro no próprio campo e mantém os outros valores', async () => {
    renderizarPagina()
    await screen.findByLabelText('Senha atual', {}, ESPERA)

    preencherSenha('errada', 'nova12345', 'nova12345')

    expect(await screen.findByText('Senha atual incorreta.', {}, ESPERA)).toBeInTheDocument()
    expect(screen.getByLabelText('Senha atual')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Nova senha')).toHaveValue('nova12345')
  })

  it('nova senha igual à atual não envia e mostra erro', async () => {
    renderizarPagina()
    await screen.findByLabelText('Senha atual', {}, ESPERA)

    preencherSenha('senha123', 'senha123', 'senha123')

    expect(
      await screen.findByText('A nova senha precisa ser diferente da senha atual.'),
    ).toBeInTheDocument()
  })

  it('senha correta mostra sucesso e limpa os três campos', async () => {
    renderizarPagina()
    await screen.findByLabelText('Senha atual', {}, ESPERA)

    preencherSenha('senha123', 'nova12345', 'nova12345')

    expect(await screen.findByText('Senha alterada com sucesso.', {}, ESPERA)).toBeInTheDocument()
    expect(screen.getByLabelText('Senha atual')).toHaveValue('')
    expect(screen.getByLabelText('Nova senha')).toHaveValue('')
    expect(screen.getByLabelText('Confirmar nova senha')).toHaveValue('')
  })

  it('começa com assinatura "Ainda não cadastrada"', async () => {
    renderizarPagina()

    expect(await screen.findByText('Ainda não cadastrada', {}, ESPERA)).toBeInTheDocument()
  })
})
