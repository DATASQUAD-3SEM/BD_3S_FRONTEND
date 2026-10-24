import { describe, expect, it } from 'vitest'
import { formatarData, formatarPrecCp } from './formatters'

describe('formatarPrecCp', () => {
  it('aplica a máscara 999999999-99', () => {
    expect(formatarPrecCp('45872213300')).toBe('458722133-00')
  })

  it('devolve o valor original quando nao tem 11 digitos', () => {
    expect(formatarPrecCp('abc')).toBe('abc')
  })
})

describe('formatarData', () => {
  it('converte yyyy-mm-dd para dd/mm/yyyy', () => {
    expect(formatarData('2026-12-01')).toBe('01/12/2026')
  })
})
