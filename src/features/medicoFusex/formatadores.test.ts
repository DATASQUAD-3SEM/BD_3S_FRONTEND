import { describe, expect, it } from 'vitest'
import { formatarCpf, formatarPrecCp } from './formatadores'

describe('formatarCpf', () => {
  it('aplica a máscara em 11 dígitos', () => {
    expect(formatarCpf('11144477735')).toBe('111.444.777-35')
  })

  it('devolve o valor original quando não tem 11 dígitos', () => {
    expect(formatarCpf('123')).toBe('123')
  })
})

describe('formatarPrecCp', () => {
  it('coloca o hífen antes dos dois últimos dígitos', () => {
    expect(formatarPrecCp('45890010003')).toBe('458900100-03')
  })

  it('devolve o valor original quando não tem 11 dígitos', () => {
    expect(formatarPrecCp('999')).toBe('999')
  })
})
