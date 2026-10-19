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

/**
 * "Banco de dados" falso do beneficiario logado.
 * As funcoes do mock (beneficiarioApi.ts) leem e alteram este estado,
 * para que o mock se comporte como o backend: o que foi salvo continua salvo
 * enquanto a pagina estiver aberta.
 */
interface EstadoMock {
  telefone: string | null
  senha: string
  assinaturaCadastrada: boolean
  tentativasSenhaErrada: number
  /** Momento (em milissegundos) ate quando as trocas de senha ficam bloqueadas. null = sem bloqueio. */
  bloqueadoAte: number | null
}

const ESTADO_INICIAL: EstadoMock = {
  telefone: '(12) 98765-4221',
  senha: 'senha123',
  assinaturaCadastrada: false,
  tentativasSenhaErrada: 0,
  bloqueadoAte: null,
}

export const estadoMock: EstadoMock = { ...ESTADO_INICIAL }

/** Volta o mock ao estado inicial. Usado nos testes. */
export function reiniciarEstadoMock(): void {
  Object.assign(estadoMock, ESTADO_INICIAL)
}

function montarBeneficiarioMock(): Beneficiario {
  return {
    nome: 'Antonio Carlos',
    cpf: '12345678900',
    precCp: '45872213300',
    telefone: estadoMock.telefone,
    dataNascimento: '1978-05-10',
    grupo: 'Exército Brasileiro · FUSEX',
    assinaturaCadastrada: estadoMock.assinaturaCadastrada,
  }
}

async function buscarBeneficiarioNoBackend(): Promise<Beneficiario> {
  return get<Beneficiario>('/beneficiarios/me')
}

export async function obterBeneficiarioLogado(): Promise<Beneficiario> {
  if (USAR_MOCK_BENEFICIARIO) {
    return montarBeneficiarioMock()
  }

  return buscarBeneficiarioNoBackend()
}
