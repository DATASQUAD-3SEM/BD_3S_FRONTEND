import { describe, expect, it } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import MedicoSecao from './MedicoSecao'

describe('MedicoSecao (T34-FE1)', () => {
  it('mostra Nome, Patente, CRM, CPF e Prec CP do médico logado', () => {
    render(
      <MedicoSecao
        medico={{ nome: 'Carlos Eduardo Lima', patente: 'Capitao', crm: '123456-SP', cpf: '11144477735', precCp: '11122233344' }}
        carregando={false}
        erro={null}
      />,
    )
    const secao = screen.getByRole('region', { name: 'Médico solicitante' })
    for (const rotulo of ['Nome', 'Patente', 'CRM', 'CPF', 'Prec CP']) {
      expect(within(secao).getByText(rotulo)).toBeInTheDocument()
    }
    expect(within(secao).getByText('Carlos Eduardo Lima')).toBeInTheDocument()
    expect(within(secao).getByText('Capitao')).toBeInTheDocument()
    expect(within(secao).getByText('123456-SP')).toBeInTheDocument()
    expect(within(secao).getByText('111.444.777-35')).toBeInTheDocument()
    expect(within(secao).getByText('111222333-44')).toBeInTheDocument()
  })

  it('CPF ou Prec CP ausente mostra "—" sem quebrar a tela', () => {
    render(
      <MedicoSecao
        medico={{ nome: 'Carlos Eduardo Lima', patente: 'Capitao', crm: '123456-SP', cpf: null, precCp: '' }}
        carregando={false}
        erro={null}
      />,
    )
    expect(screen.getAllByText('—')).toHaveLength(2)
  })
})
