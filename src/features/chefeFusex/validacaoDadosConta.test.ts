import { describe, expect, it } from 'vitest'
import { ApiError } from '../../shared/api/http'
import { errosDoBackend, validarDadosConta, type DadosConta } from './validacaoDadosConta'

const VALIDOS: DadosConta = { nome: 'Chefe do FUSEX', patente: 'Coronel', login: 'chefe.fusex', novaSenha: '' }

describe('validarDadosConta', () => {
  it('não acusa erro quando os dados são válidos e a senha está em branco', () => {
    expect(validarDadosConta(VALIDOS)).toEqual({})
  })

  it('exige nome, patente e login', () => {
    const erros = validarDadosConta({ ...VALIDOS, nome: '  ', patente: '', login: '' })

    expect(erros.nome).toBe('O nome é obrigatório.')
    expect(erros.patente).toBe('A patente é obrigatória.')
    expect(erros.login).toBe('O login é obrigatório.')
  })

  it('rejeita login com espaços no meio', () => {
    expect(validarDadosConta({ ...VALIDOS, login: 'chefe novo' }).login).toBe(
      'O login não pode conter espaços.',
    )
  })

  it('rejeita nova senha com menos de 8 caracteres, mas aceita senha vazia', () => {
    expect(validarDadosConta({ ...VALIDOS, novaSenha: 'curta' }).novaSenha).toMatch(/mínimo 8/)
    expect(validarDadosConta({ ...VALIDOS, novaSenha: '' }).novaSenha).toBeUndefined()
  })
})

describe('errosDoBackend', () => {
  it('409 vira erro no campo login com a mensagem do servidor', () => {
    const erro = new ApiError(409, 'Já existe um usuário com esse login.')

    expect(errosDoBackend(erro)).toEqual({
      campos: { login: 'Já existe um usuário com esse login.' },
      geral: null,
    })
  })

  it('detalhes "campo: mensagem" são distribuídos nos campos certos', () => {
    const erro = new ApiError(400, 'Dados invalidos', ['nome: O nome é obrigatório.'])

    expect(errosDoBackend(erro)).toEqual({
      campos: { nome: 'O nome é obrigatório.' },
      geral: null,
    })
  })

  it('detalhes sem campo conhecido viram mensagem geral', () => {
    const erro = new ApiError(500, 'Erro interno', ['falha inesperada'])

    expect(errosDoBackend(erro)).toEqual({ campos: {}, geral: 'falha inesperada' })
  })

  it('erro que não é ApiError vira mensagem geral padrão', () => {
    expect(errosDoBackend(new Error('x')).geral).toBe('Não foi possível salvar. Tente novamente.')
  })
})
