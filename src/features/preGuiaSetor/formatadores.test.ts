import { describe, expect, it } from 'vitest'
import { textoCriadaPor } from './formatadores'

describe('textoCriadaPor (T17-FE)', () => {
  it('mostra patente, nome, CRM e Prec CP formatado do médico que criou a pré-guia', () => {
    expect(textoCriadaPor({ patente: 'Capitao', nome: 'Carlos Eduardo Lima', crm: '123456-SP', precCp: '11122233344' }))
      .toBe('Criada pelo Capitao Carlos Eduardo Lima (CRM 123456-SP · Prec CP 111222333-44)')
  })

  it('sem Prec CP mostra "Prec CP —"', () => {
    expect(textoCriadaPor({ patente: 'Capitao', nome: 'Carlos Eduardo Lima', crm: '123456-SP', precCp: null }))
      .toBe('Criada pelo Capitao Carlos Eduardo Lima (CRM 123456-SP · Prec CP —)')
    expect(textoCriadaPor({ patente: 'Capitao', nome: 'Carlos Eduardo Lima', crm: '123456-SP', precCp: '' }))
      .toBe('Criada pelo Capitao Carlos Eduardo Lima (CRM 123456-SP · Prec CP —)')
  })
})
