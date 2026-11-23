import { describe, it, expect } from 'vitest'
import { avisoPrazoOcs } from './formatadores'

/** T24-FE1 (regra 12.8): aviso do prazo da OCS no cartão e no detalhe da fatura Aguardando a OCS. */
describe('T24-FE1 · aviso de prazo da OCS', () => {
  const agora = new Date('2026-11-12T12:00:00')
  const aguardando = { situacao: 'AGUARDANDO_OCS' as const, prazoOcs: '2026-11-16T23:59:59', dataCiencia: null }

  it('dentro do prazo: "Prazo da OCS: até dd/mm/aaaa"', () => {
    expect(avisoPrazoOcs(aguardando, agora)).toBe('Prazo da OCS: até 16/11/2026')
  })

  it('prazo vencido: "Prazo da OCS vencido em dd/mm/aaaa"', () => {
    expect(avisoPrazoOcs(aguardando, new Date('2026-11-17T00:00:00'))).toBe('Prazo da OCS vencido em 16/11/2026')
  })

  it('com ciência: data e, quando houver, o responsável', () => {
    const comCiencia = { ...aguardando, dataCiencia: '2026-11-13T10:00:00' }
    expect(avisoPrazoOcs(comCiencia, agora)).toBe('A OCS deu ciência das glosas em 13/11/2026.')
    expect(avisoPrazoOcs({ ...comCiencia, responsavelCiencia: 'Bruno Lima' }, agora)).toBe(
      'A OCS deu ciência das glosas em 13/11/2026 (Bruno Lima).',
    )
  })

  it('nas demais situações, nenhum aviso', () => {
    expect(avisoPrazoOcs({ ...aguardando, situacao: 'EM_LISURA' }, agora)).toBeNull()
    expect(avisoPrazoOcs({ ...aguardando, situacao: 'EM_AUDITORIA' }, agora)).toBeNull()
    expect(avisoPrazoOcs({ situacao: 'AGUARDANDO_OCS', prazoOcs: null, dataCiencia: null }, agora)).toBeNull()
  })
})
