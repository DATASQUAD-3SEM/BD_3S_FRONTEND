import type { ChefePerfil } from '../../shared/types/domain'

/**
 * Dados simulados do Chefe usados quando o modo mock de chefeApi.ts esta ativo e nos testes.
 */

interface EstadoMockChefe {
  nome: string
  patente: string
  login: string
  senha: string
  assinaturaCadastrada: boolean
}

const ESTADO_INICIAL: EstadoMockChefe = {
  nome: 'Chefe do FUSEX',
  patente: 'Coronel',
  login: 'chefe.fusex',
  senha: 'senha123',
  assinaturaCadastrada: false,
}

export const LOGIN_EM_USO_MOCK = 'login.em.uso'

export const estadoMockChefe: EstadoMockChefe = { ...ESTADO_INICIAL }

export function reiniciarEstadoMockChefe(): void {
  Object.assign(estadoMockChefe, ESTADO_INICIAL)
}

export function montarChefeMock(): ChefePerfil {
  return {
    nome: estadoMockChefe.nome,
    patente: estadoMockChefe.patente,
    login: estadoMockChefe.login,
    assinaturaCadastrada: estadoMockChefe.assinaturaCadastrada,
  }
}
