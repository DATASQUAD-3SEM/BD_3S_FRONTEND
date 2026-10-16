import { describe, expect, it } from 'vitest'
import { calcularIdade, faixaEtaria, formatarCpf, formatarPrecCp } from './formatar'

describe('formatar', () => {
  it('formata CPF e Prec CP com 11 dígitos', () => {
    expect(formatarCpf('12345678900')).toBe('123.456.789-00')
    expect(formatarPrecCp('45872213300')).toBe('458722133-00')
  })

  it('devolve o valor original quando não tem 11 dígitos', () => {
    expect(formatarCpf('123')).toBe('123')
    expect(formatarPrecCp('abc')).toBe('abc')
  })

  it('calcula a idade considerando o aniversário', () => {
    const hoje = new Date('2026-10-15T12:00:00')
    expect(calcularIdade('1978-10-15', hoje)).toBe(48)
    expect(calcularIdade('1978-10-16', hoje)).toBe(47)
  })

  it('deriva a faixa etária', () => {
    expect(faixaEtaria(17)).toBe('Menor de 18')
    expect(faixaEtaria(45)).toBe('41 a 50')
    expect(faixaEtaria(71)).toBe('Acima de 70')
  })
})
