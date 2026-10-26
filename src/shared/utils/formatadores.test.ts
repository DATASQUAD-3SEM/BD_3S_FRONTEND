import { describe, expect, it } from 'vitest'
import {
  cpfValido,
  formatarCpf,
  formatarData,
  formatarPrecCp,
  formatarTelefone,
  mascaraCpf,
  mascaraPrecCp,
  mascaraTelefone,
} from './formatadores'

/**
 * Testes dos formatadores e mascaras compartilhados (CPF, Prec CP, telefone e data).
 */

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
    expect(formatarPrecCp('45872213300')).toBe('458722133-00')
  })

  it('devolve o valor original quando não tem 11 dígitos', () => {
    expect(formatarPrecCp('abc')).toBe('abc')
  })
})

describe('formatarData', () => {
  it('converte yyyy-mm-dd (com ou sem horário) para dd/mm/yyyy', () => {
    expect(formatarData('2026-12-01')).toBe('01/12/2026')
    expect(formatarData('2026-12-01T10:30:00')).toBe('01/12/2026')
  })

  it('devolve texto vazio sem data', () => {
    expect(formatarData(null)).toBe('')
    expect(formatarData(undefined)).toBe('')
  })
})

describe('formatarTelefone', () => {
  it('formata celular e fixo', () => {
    expect(formatarTelefone('12987654321')).toBe('(12) 98765-4321')
    expect(formatarTelefone('1234567890')).toBe('(12) 3456-7890')
  })

  it('mostra travessão sem telefone', () => {
    expect(formatarTelefone(null)).toBe('—')
  })
})

describe('máscaras de digitação', () => {
  it('aplicam o formato parcial enquanto o usuário digita', () => {
    expect(mascaraCpf('5299822')).toBe('529.982.2')
    expect(mascaraPrecCp('4587221330099')).toBe('458722133-00')
    expect(mascaraTelefone('1298765')).toBe('(12) 98765')
  })
})

describe('cpfValido', () => {
  it('confere os dígitos verificadores', () => {
    expect(cpfValido('52998224725')).toBe(true)
    expect(cpfValido('52998224724')).toBe(false)
    expect(cpfValido('11111111111')).toBe(false)
  })
})
