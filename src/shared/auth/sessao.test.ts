import { afterEach, describe, expect, it } from 'vitest'
import { atualizarLoginDaSessao, encerrarSessao, lerSessao, salvarSessao } from './sessao'

/**
 * Testes da sessao guardada no navegador: gravacao, leitura, conteudo invalido e troca de login do chefe.
 */

afterEach(() => localStorage.clear())

describe('sessao', () => {
  it('salva a sessao e o login usado pelo cliente HTTP', () => {
    salvarSessao({ login: 'setor.guias', perfil: 'SETOR_GUIAS', nome: 'Setor de Guias' })

    expect(lerSessao()).toEqual({ login: 'setor.guias', perfil: 'SETOR_GUIAS', nome: 'Setor de Guias' })
    expect(localStorage.getItem('X-Usuario-Login')).toBe('setor.guias')
  })

  it('encerrar remove a sessao e o login', () => {
    salvarSessao({ login: 'recepcao', perfil: 'RECEPCAO', nome: 'Recepcao' })
    encerrarSessao()

    expect(lerSessao()).toBeNull()
    expect(localStorage.getItem('X-Usuario-Login')).toBeNull()
  })

  it('ignora conteudo invalido ou perfil desconhecido', () => {
    localStorage.setItem('nexus-sessao', '{quebrado')
    expect(lerSessao()).toBeNull()

    localStorage.setItem('nexus-sessao', JSON.stringify({ login: 'x', perfil: 'ADMIN', nome: 'x' }))
    expect(lerSessao()).toBeNull()
  })

  it('acompanha a troca de login do chefe somente quando a sessao era dele', () => {
    salvarSessao({ login: 'chefe.fusex', perfil: 'CHEFE_FUSEX', nome: 'Maria' })
    atualizarLoginDaSessao('outro.login', 'chefe.novo')
    expect(lerSessao()?.login).toBe('chefe.fusex')

    atualizarLoginDaSessao('chefe.fusex', 'chefe.novo')
    expect(lerSessao()?.login).toBe('chefe.novo')
  })
})
