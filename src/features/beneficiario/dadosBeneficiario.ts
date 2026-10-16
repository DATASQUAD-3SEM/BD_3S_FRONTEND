import { get } from '../../shared/api/http'
import type { Beneficiario } from '../../shared/types/domain'

/**
 * true: utiliza o mock local.
 * false: consulta o backend.
 *
 * Troque para false quando GET /beneficiarios/me
 * estiver implementado e testado no backend.
 */
const USAR_MOCK_BENEFICIARIO = true

const beneficiarioMock: Beneficiario = {
  nome: 'Antonio Carlos',
  cpf: '12345678900',
  precCp: '45872213300',
  telefone: '(12) 98765-4221',
  dataNascimento: '1978-05-10',
  grupo: 'Exército Brasileiro · FUSEX',
}

async function buscarBeneficiarioNoBackend(): Promise<Beneficiario> {
  return get<Beneficiario>('/beneficiarios/me')
}

export async function obterBeneficiarioLogado(): Promise<Beneficiario> {
  if (USAR_MOCK_BENEFICIARIO) {
    return beneficiarioMock
  }

  return buscarBeneficiarioNoBackend()
}
