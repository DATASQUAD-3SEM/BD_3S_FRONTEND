import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import MedicosPage from '.'
import { alterarSituacaoMedico, atualizarMedico, cadastrarMedico, listarMedicos } from '../apiCadastro'
import type { Medico } from './types'

vi.mock('../apiCadastro', () => ({
  listarMedicos: vi.fn(),
  cadastrarMedico: vi.fn(),
  atualizarMedico: vi.fn(),
  alterarSituacaoMedico: vi.fn(),
}))

const helena: Medico = {
  id: 1, nome: 'Helena Duarte Quintanilha', patente: 'Maj Med', cpf: '12345678901',
  precCp: '00987654321', crm: 'CRM-SP 123456', ativo: true,
}
const roberto: Medico = {
  id: 2, nome: 'Roberto Matos Bastos', patente: 'Cap Med', cpf: '22233344455',
  precCp: '00123456789', crm: 'CRM-RJ 654321', ativo: true,
}
const sergio: Medico = {
  id: 3, nome: 'Sérgio Lemos Vieira', patente: 'Ten Cel Med', cpf: '33344455566',
  precCp: '00555666777', crm: 'CRM-SP 112233', ativo: false,
}

function preencher(rotulo: string, valor: string) {
  fireEvent.change(screen.getByLabelText(rotulo), { target: { value: valor } })
}

beforeEach(() => {
  vi.mocked(listarMedicos).mockReset()
  vi.mocked(cadastrarMedico).mockReset()
  vi.mocked(atualizarMedico).mockReset()
  vi.mocked(alterarSituacaoMedico).mockReset()
  vi.mocked(listarMedicos).mockResolvedValue([helena, roberto, sergio])
})

describe('MedicosPage', () => {
  it('por padrão lista todos os médicos, ativos e inativos', async () => {
    render(<MedicosPage />)

    expect(await screen.findByText('Helena Duarte Quintanilha')).toBeInTheDocument()
    expect(screen.getByText('Roberto Matos Bastos')).toBeInTheDocument()
    expect(screen.getByText('Sérgio Lemos Vieira')).toBeInTheDocument()
    expect((screen.getByLabelText('Filtrar por situação') as HTMLSelectElement).value).toBe('todos')
  })

  it('o filtro restringe a Ativos ou Inativos', async () => {
    render(<MedicosPage />)
    await screen.findByText('Helena Duarte Quintanilha')

    fireEvent.change(screen.getByLabelText('Filtrar por situação'), { target: { value: 'ativos' } })
    expect(screen.getByText('Roberto Matos Bastos')).toBeInTheDocument()
    expect(screen.queryByText('Sérgio Lemos Vieira')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Filtrar por situação'), { target: { value: 'inativos' } })
    expect(screen.getByText('Sérgio Lemos Vieira')).toBeInTheDocument()
    expect(screen.queryByText('Roberto Matos Bastos')).not.toBeInTheDocument()
  })

  it('busca por nome, CPF, Prec CP ou CRM', async () => {
    render(<MedicosPage />)
    await screen.findByText('Helena Duarte Quintanilha')

    fireEvent.change(screen.getByLabelText('Buscar médico'), { target: { value: 'roberto' } })
    expect(screen.queryByText('Helena Duarte Quintanilha')).not.toBeInTheDocument()
    expect(screen.getByText('Roberto Matos Bastos')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Buscar médico'), { target: { value: '123.456.789-01' } })
    expect(screen.getByText('Helena Duarte Quintanilha')).toBeInTheDocument()
    expect(screen.queryByText('Roberto Matos Bastos')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Buscar médico'), { target: { value: '00555666' } })
    expect(screen.getByText('Sérgio Lemos Vieira')).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Buscar médico'), { target: { value: 'crm-rj' } })
    expect(screen.getByText('Roberto Matos Bastos')).toBeInTheDocument()
    expect(screen.queryByText('Sérgio Lemos Vieira')).not.toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Buscar médico'), { target: { value: 'zzz' } })
    expect(screen.getByText('Nenhum médico encontrado.')).toBeInTheDocument()
  })

  it('cadastra um novo médico, mostra na lista e limpa o formulário', async () => {
    const criado: Medico = {
      id: 9, nome: 'Nova Médica', patente: 'Cap Med', cpf: '55566677788',
      precCp: '00111222333', crm: 'CRM-SP 445566', ativo: true,
    }
    vi.mocked(cadastrarMedico).mockResolvedValue(criado)
    render(<MedicosPage />)
    await screen.findByText('Helena Duarte Quintanilha')

    preencher('Nome', 'Nova Médica')
    preencher('Patente', 'Cap Med')
    preencher('CPF (será o login)', '55566677788')
    preencher('Prec CP', '00111222333')
    preencher('CRM', 'CRM-SP 445566')
    preencher('Senha inicial', 'abc123')
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar médico' }))

    expect(await screen.findByText('Médico Nova Médica cadastrado.')).toBeInTheDocument()
    expect(cadastrarMedico).toHaveBeenCalledWith(
      expect.objectContaining({ nome: 'Nova Médica', crm: 'CRM-SP 445566', senha: 'abc123' }),
    )
    expect(screen.getByText('Nova Médica', { selector: 'td' })).toBeInTheDocument()
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('')
  })

  it('erro no cadastro mostra a mensagem e mantém os dados digitados', async () => {
    vi.mocked(cadastrarMedico).mockRejectedValue(new Error('Já existe um médico com este CRM.'))
    render(<MedicosPage />)
    await screen.findByText('Helena Duarte Quintanilha')

    preencher('Nome', 'Nova Médica')
    preencher('Patente', 'Cap Med')
    preencher('CPF (será o login)', '55566677788')
    preencher('Prec CP', '00111222333')
    preencher('CRM', 'CRM-SP 123456')
    preencher('Senha inicial', 'abc123')
    fireEvent.click(screen.getByRole('button', { name: 'Cadastrar médico' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Já existe um médico com este CRM.')
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Nova Médica')
  })

  it('Editar preenche o formulário, mostra o selo, destaca a linha e Salvar atualiza', async () => {
    vi.mocked(atualizarMedico).mockResolvedValue({ ...helena, patente: 'Ten Cel Med' })
    render(<MedicosPage />)
    await screen.findByText('Helena Duarte Quintanilha')

    fireEvent.click(screen.getByRole('button', { name: 'Editar Helena Duarte Quintanilha' }))

    expect(screen.getByRole('heading', { name: 'Editando médico' })).toBeInTheDocument()
    expect(screen.getByText('Modo de edição')).toBeInTheDocument()
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('Helena Duarte Quintanilha')
    expect(screen.getAllByRole('row')[1]).toHaveAttribute('data-editando', 'true')

    preencher('Patente', 'Ten Cel Med')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Alterações em Helena Duarte Quintanilha salvas.')).toBeInTheDocument()
    expect(atualizarMedico).toHaveBeenCalledWith(1, expect.objectContaining({ patente: 'Ten Cel Med' }))
    expect(screen.getByRole('heading', { name: 'Novo médico' })).toBeInTheDocument()
    expect(screen.queryByText('Modo de edição')).not.toBeInTheDocument()
  })

  it('Cancelar a edição volta ao formulário de novo cadastro', async () => {
    render(<MedicosPage />)
    await screen.findByText('Helena Duarte Quintanilha')

    fireEvent.click(screen.getByRole('button', { name: 'Editar Roberto Matos Bastos' }))
    fireEvent.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(screen.getByRole('heading', { name: 'Novo médico' })).toBeInTheDocument()
    expect(screen.queryByText('Modo de edição')).not.toBeInTheDocument()
    expect((screen.getByLabelText('Nome') as HTMLInputElement).value).toBe('')
  })

  it('o Chefe também edita um médico inativo (todos os dados)', async () => {
    vi.mocked(atualizarMedico).mockResolvedValue({ ...sergio, nome: 'Sérgio L. Vieira' })
    render(<MedicosPage />)
    await screen.findByText('Sérgio Lemos Vieira')

    fireEvent.click(screen.getByRole('button', { name: 'Editar Sérgio Lemos Vieira' }))
    expect((screen.getByLabelText('Situação') as HTMLSelectElement).value).toBe('inativo')

    preencher('Nome', 'Sérgio L. Vieira')
    preencher('Patente', 'Cel Med')
    preencher('CPF (login)', '33344455577')
    preencher('Prec CP', '00555666888')
    preencher('CRM', 'CRM-SP 112244')
    preencher('Nova senha (deixe em branco para manter)', 'novaSenha1')
    fireEvent.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(await screen.findByText('Alterações em Sérgio L. Vieira salvas.')).toBeInTheDocument()
    expect(atualizarMedico).toHaveBeenCalledWith(
      3,
      expect.objectContaining({
        nome: 'Sérgio L. Vieira', patente: 'Cel Med', cpf: '33344455577',
        precCp: '00555666888', crm: 'CRM-SP 112244', senha: 'novaSenha1', ativo: false,
      }),
    )
  })

  it('Desativar mantém o médico na lista como Inativo (histórico preservado)', async () => {
    vi.mocked(alterarSituacaoMedico).mockResolvedValue({ ...helena, ativo: false })
    render(<MedicosPage />)
    await screen.findByText('Helena Duarte Quintanilha')

    fireEvent.click(screen.getByRole('button', { name: 'Desativar Helena Duarte Quintanilha' }))

    expect(await screen.findByText(/Helena Duarte Quintanilha desativado\. O histórico foi mantido\./)).toBeInTheDocument()
    expect(alterarSituacaoMedico).toHaveBeenCalledWith(1, false)
    expect(screen.getByRole('button', { name: 'Reativar Helena Duarte Quintanilha' })).toBeInTheDocument()

    fireEvent.change(screen.getByLabelText('Filtrar por situação'), { target: { value: 'ativos' } })
    expect(screen.queryByText('Helena Duarte Quintanilha', { selector: 'td' })).not.toBeInTheDocument()
  })

  it('Reativar devolve o médico aos ativos', async () => {
    vi.mocked(alterarSituacaoMedico).mockResolvedValue({ ...sergio, ativo: true })
    render(<MedicosPage />)
    await screen.findByText('Helena Duarte Quintanilha')

    fireEvent.click(screen.getByRole('button', { name: 'Reativar Sérgio Lemos Vieira' }))

    expect(await screen.findByText('Sérgio Lemos Vieira reativado.')).toBeInTheDocument()
    expect(alterarSituacaoMedico).toHaveBeenCalledWith(3, true)
  })

  it('mostra erro quando a lista não carrega', async () => {
    vi.mocked(listarMedicos).mockRejectedValue(new Error('Sem resposta do servidor'))
    render(<MedicosPage />)

    expect(await screen.findByRole('alert')).toHaveTextContent('Sem resposta do servidor')
  })
})
