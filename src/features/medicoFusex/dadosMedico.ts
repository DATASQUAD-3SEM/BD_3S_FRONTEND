import type { MedicoPerfil } from '../../shared/types/domain'


/**
 * Dados simulados do medico usados quando o modo mock de medicoApi.ts esta ativo e nos testes.
 */

interface EstadoMockMedico {
  senha: string
  assinaturaCadastrada: boolean
}

const ESTADO_INICIAL: EstadoMockMedico = {
  senha: 'senha123',
  assinaturaCadastrada: false,
}

export const estadoMockMedico: EstadoMockMedico = { ...ESTADO_INICIAL }

export function reiniciarEstadoMockMedico(): void {
  Object.assign(estadoMockMedico, ESTADO_INICIAL)
}

export function montarMedicoMock(): MedicoPerfil {
  return {
    nome: 'Carlos Eduardo Lima',
    patente: 'Capitão Médico',
    cpf: '11144477735',
    precCp: '11122233344',
    crm: '123456-SP',
    assinaturaCadastrada: estadoMockMedico.assinaturaCadastrada,
  }
}
