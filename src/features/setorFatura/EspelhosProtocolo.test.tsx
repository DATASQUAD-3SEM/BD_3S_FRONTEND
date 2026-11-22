import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EspelhosRecebidosPage from './EspelhosRecebidosPage'
import type { EspelhoDetalhe, EspelhoResumo, SetorFaturasApi } from './types'

const espelhoSemNumero: EspelhoResumo = {
  id: 1,
  ocs: 'Laboratorio Exemplo',
  dataInicio: '2026-10-03T00:00:00',
  dataEnvio: '2026-11-02T09:00:00',
  dataEntrada: '2026-11-02T09:00:00',
  situacao: 'RECEBIDO',
  numeroFatura: null,
  valorTotal: 210,
}

const detalheSemNumero = {
  id: 1,
  ocs: 'Laboratorio Exemplo',
  dataInicio: espelhoSemNumero.dataInicio,
  dataEnvio: espelhoSemNumero.dataEnvio,
  dataEntrada: espelhoSemNumero.dataEntrada,
  situacao: 'RECEBIDO',
  numeroFatura: null,
  valorTotal: 210,
  linhas: [],
  totais: { informado: 210, glosa: null, final: null },
  eventos: [],
  controleFluxo: [],
} as unknown as EspelhoDetalhe

const detalheProtocolado = {
  ...detalheSemNumero,
  situacao: 'PROTOCOLADA',
  numeroFatura: '007/2026',
} as unknown as EspelhoDetalhe

describe('Protocolo da fatura pela tela de Espelhos Recebidos (T24-FE2)', () => {
  it('protocola o espelho e o cartão passa a Fatura protocolada', async () => {
    const user = userEvent.setup()
    const protocolarFatura = vi.fn().mockResolvedValue(detalheProtocolado)
    const api: SetorFaturasApi = {
      listarEspelhosRecebidos: vi
        .fn()
        .mockResolvedValueOnce([espelhoSemNumero])
        .mockResolvedValueOnce([{ ...espelhoSemNumero, situacao: 'PROTOCOLADA', numeroFatura: '007/2026' }]),
      detalharEspelho: vi.fn().mockResolvedValue(detalheSemNumero),
      proximoNumeroFatura: vi.fn().mockResolvedValue('007/2026'),
      protocolarFatura,
      enviarParaLisura: vi.fn(),
    }

    render(<EspelhosRecebidosPage api={api} />)
    await user.click(await screen.findByRole('button', { name: /Espelho nº 1|Laboratorio Exemplo/ }))
    await user.click(await screen.findByRole('button', { name: 'Inserir nº da fatura' }))

    expect(await screen.findByLabelText('Nº da Fatura')).toHaveValue('007/2026')
    await user.type(screen.getByLabelText('Responsável (seu nome)'), 'Sd Almeida')
    await user.click(screen.getByRole('button', { name: 'Salvar protocolo' }))

    await waitFor(() =>
      expect(protocolarFatura).toHaveBeenCalledWith(1, { numeroFatura: '007/2026', responsavel: 'Sd Almeida' }),
    )
    expect(await screen.findByText(/Nº da fatura: 007\/2026/)).toBeInTheDocument()
  })
})
