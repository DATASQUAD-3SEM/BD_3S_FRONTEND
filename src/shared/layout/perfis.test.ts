import { beforeEach, describe, expect, it } from 'vitest'
import { CHAVE_LOGIN, CHAVE_PERFIL, LOGIN_PADRAO, entrarComo, garantirPerfilSimulado } from './perfis'

describe('login simulado por perfil (T0-FE)', () => {
  beforeEach(() => localStorage.clear())

  it('ao abrir a área de um perfil sem login, usa a conta do seed daquele perfil', () => {
    garantirPerfilSimulado('CHEFE_FUSEX')
    expect(localStorage.getItem(CHAVE_LOGIN)).toBe('chefe.fusex')
    expect(localStorage.getItem(CHAVE_PERFIL)).toBe('CHEFE_FUSEX')
  })

  it('ao trocar de área, troca para a conta do outro perfil', () => {
    garantirPerfilSimulado('MEDICO')
    garantirPerfilSimulado('SETOR_GUIAS')
    expect(localStorage.getItem(CHAVE_LOGIN)).toBe(LOGIN_PADRAO.SETOR_GUIAS)
  })

  it('no mesmo perfil, mantém o login atual (ex.: chefe que trocou o próprio login)', () => {
    entrarComo('CHEFE_FUSEX')
    localStorage.setItem(CHAVE_LOGIN, 'chefe.novo')

    garantirPerfilSimulado('CHEFE_FUSEX')

    expect(localStorage.getItem(CHAVE_LOGIN)).toBe('chefe.novo')
  })

  it('entrarComo grava o perfil e a conta do seed', () => {
    entrarComo('BENEFICIARIO')
    expect(localStorage.getItem(CHAVE_PERFIL)).toBe('BENEFICIARIO')
    expect(localStorage.getItem(CHAVE_LOGIN)).toBe('52998224725')
  })
})
