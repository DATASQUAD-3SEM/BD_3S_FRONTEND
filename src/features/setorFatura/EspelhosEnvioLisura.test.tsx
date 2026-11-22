import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import EspelhosRecebidosPage from './EspelhosRecebidosPage'
import type { EspelhoDetalhe, EspelhoResumo, SetorFaturasApi } from './types'

const faturaProtocolada: EspelhoResumo = {
  id: 2,
  ocs: 'Laboratorio Exemplo',
  dataInicio: '2026-10-03T00:00:00',
  dataEnvio: '2026-11-02T09:00:00',
  dataEntrada: '2026-11-02T09:00:00',
  situacao: 'PROTOCOLADA',
  numeroFatura: '007/2026',
  valorTotal: 210,
}

const detalheProtocolada = {
  ...faturaProtocolada,
  linhas: [],
  totais: { informado: 210, glosa: null, final: null },
  eventos: [],
  controleFluxo: [],
} as unknown as EspelhoDetalhe

describe('Envio para a rastreabilidade pela tela (T24-FE3)', () => {
  it('envia a fatura protocolada e ela passa a Em lisura', async () => {
    const user = userEvent.setup()
    const enviarParaLisura = vi.fn().mockResolvedValue({ ...detalheProtocolada, situacao: 'EM_LISURA' })
    const api: SetorFaturasApi = {
      listarAuditadas: vi.fn(),
      listarEspelhosRecebidos: vi
        .fn()
        .mockResolvedValueOnce([faturaProtocolada])
        .mockResolvedValueOnce([{ ...faturaProtocolada, situacao: 'EM_LISURA' }]),
      detalharEspelho: vi.fn().mockResolvedValue(detalheProtocolada),
      proximoNumeroFatura: vi.fn().mockResolvedValue('008/2026'),
      protocolarFatura: vi.fn(),
      enviarParaLisura,
    }

    render(<EspelhosRecebidosPage api={api} />)
    await user.click(await screen.findByRole('button', { name: /Laboratorio Exemplo/ }))
    await user.click(await screen.findByRole('button', { name: 'Enviar para a rastreabilidade' }))
    await user.type(screen.getByLabelText('Responsável pelo envio'), 'Sd Almeida')
    await user.click(screen.getByRole('button', { name: 'Confirmar envio' }))

    await waitFor(() => expect(enviarParaLisura).toHaveBeenCalledWith(2, { responsavel: 'Sd Almeida' }))
    await waitFor(() => expect(api.listarEspelhosRecebidos).toHaveBeenCalledTimes(2))
  })
})
