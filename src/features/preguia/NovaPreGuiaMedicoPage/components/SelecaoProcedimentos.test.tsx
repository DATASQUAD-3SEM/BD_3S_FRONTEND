import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import SelecaoProcedimentos from './SelecaoProcedimentos'
import { buscarProcedimentos } from '../../../medico/api'
import type { ProcedimentoOpcao } from '../../../medico/types'

vi.mock('../../../medicos/api', () => ({ buscarProcedimentos: vi.fn() }))

const hemograma: ProcedimentoOpcao = {
  id: 1, codigoTuss: '40304361', terminologiaProcedimento: 'Hemograma completo', rolAns: 'SIM', subgrupo: 'Hematologia',
}
const acupuntura: ProcedimentoOpcao = {
  id: 5, codigoTuss: '20104375', terminologiaProcedimento: 'Sessão de acupuntura', rolAns: 'NAO', subgrupo: 'Terapias',
}

beforeEach(() => {
  vi.mocked(buscarProcedimentos).mockReset()
})

describe('SelecaoProcedimentos', () => {
  it('sem procedimentos: avisa que nenhum foi adicionado', () => {
    render(<SelecaoProcedimentos value={[]} onChange={vi.fn()} />)
    expect(screen.getByText(/Nenhum procedimento adicionado ainda/)).toBeInTheDocument()
  })

  it('não busca com menos de 2 caracteres', () => {
    render(<SelecaoProcedimentos value={[]} onChange={vi.fn()} />)
    fireEvent.change(screen.getByLabelText(/Buscar procedimento/), { target: { value: 'h' } })
    expect(buscarProcedimentos).not.toHaveBeenCalled()
  })

  it('busca, mostra o resultado e adiciona avisando o container', async () => {
    vi.mocked(buscarProcedimentos).mockResolvedValue([hemograma])
    const onChange = vi.fn()
    render(<SelecaoProcedimentos value={[]} onChange={onChange} />)

    fireEvent.change(screen.getByLabelText(/Buscar procedimento/), { target: { value: 'hemo' } })
    fireEvent.click(await screen.findByRole('button', { name: /Adicionar Hemograma completo/ }))

    expect(buscarProcedimentos).toHaveBeenCalledWith('hemo')
    expect(onChange).toHaveBeenCalledWith([hemograma])
  })

  it('não repete na busca um procedimento já adicionado', async () => {
    vi.mocked(buscarProcedimentos).mockResolvedValue([hemograma])
    render(<SelecaoProcedimentos value={[hemograma]} onChange={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/Buscar procedimento/), { target: { value: 'hemo' } })

    expect(await screen.findByText(/Nenhum procedimento encontrado/)).toBeInTheDocument()
  })

  it('mostra os adicionados (com aviso de Rol ANS) e remove', () => {
    const onChange = vi.fn()
    render(<SelecaoProcedimentos value={[hemograma, acupuntura]} onChange={onChange} />)

    expect(screen.getByText(/Fora do Rol ANS/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Remover Hemograma completo/ }))

    expect(onChange).toHaveBeenCalledWith([acupuntura])
  })

  it('mostra erro quando a busca falha', async () => {
    vi.mocked(buscarProcedimentos).mockImplementation(() => Promise.reject(new Error('falhou')))
    render(<SelecaoProcedimentos value={[]} onChange={vi.fn()} />)

    fireEvent.change(screen.getByLabelText(/Buscar procedimento/), { target: { value: 'hemo' } })

    expect(await screen.findByRole('alert')).toHaveTextContent(/Erro ao buscar procedimentos/)
  })
})
