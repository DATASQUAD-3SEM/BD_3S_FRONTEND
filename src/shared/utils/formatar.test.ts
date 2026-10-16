import { describe, expect, it } from 'vitest'
import { calcularIdade, faixaEtaria, formatarCpf, formatarPrecCp, formatarTelefone, mascararCpf, mascararPrecCp, mascararTelefone } from './formatar'
import { telefoneValido } from '../../shared/utils/formatar'

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

  it('mascara enquanto digita e limita a 11 dígitos', () => {
    expect(mascararCpf('123')).toBe('123')
    expect(mascararCpf('1234')).toBe('123.4')
    expect(mascararCpf('1234567')).toBe('123.456.7')
    expect(mascararCpf('12345678900999')).toBe('123.456.789-00')
    expect(mascararCpf('123.456.789-00')).toBe('123.456.789-00')
    expect(mascararPrecCp('4587')).toBe('4587')
    expect(mascararPrecCp('458722133')).toBe('458722133')
    expect(mascararPrecCp('45872213300999')).toBe('458722133-00')
  })
})

describe('telefone', () => {
  it('mascararTelefone aplica a máscara aos poucos e limita a 11 dígitos', () => {
    expect(mascararTelefone('')).toBe('')
    expect(mascararTelefone('12')).toBe('(12')
    expect(mascararTelefone('129')).toBe('(12)9')
    expect(mascararTelefone('12991542346')).toBe('(12)99154-2346')
    expect(mascararTelefone('(12) 99154-2346999')).toBe('(12)99154-2346')
  })

  it('formatarTelefone formata 11 dígitos e devolve o original nos outros casos', () => {
    expect(formatarTelefone('12991542346')).toBe('(12)99154-2346')
    expect(formatarTelefone('1233334444')).toBe('1233334444')
  })

  it('telefoneValido exige 11 dígitos, DDD válido e o 9 depois do DDD', () => {
    expect(telefoneValido('(12)99154-2346')).toBe(true)
    expect(telefoneValido('1233334444')).toBe(false)
    expect(telefoneValido('12800000000')).toBe(false)
    expect(telefoneValido('01991542346')).toBe(false)
  })
})
