import type { Perfil } from '../../shared/layout/perfis'

/**
 * Contas de exemplo criadas pelo seed do backend (R__dados_exemplo.sql), usadas pelo "Acesso rapido"
 * da tela de login para gravar testes e apresentacoes. Todas usam a senha do seed.
 *
 * O acesso rapido aparece somente no modo de desenvolvimento (npm run dev) ou quando a variavel
 * VITE_ACESSO_RAPIDO=true estiver definida. Em producao ele fica oculto.
 */

export const SENHA_DEMONSTRACAO = 'senha123'

export interface ContaDemonstracao {
  perfil: Perfil
  login: string
  descricao: string
}

export const CONTAS_DEMONSTRACAO: ContaDemonstracao[] = [
  { perfil: 'BENEFICIARIO', login: '52998224725', descricao: 'Cria e acompanha pré-guias e baixa as Guias.' },
  { perfil: 'MEDICO', login: '11144477735', descricao: 'Cria pré-guias, corrige as devolvidas e assina Guias.' },
  { perfil: 'CHEFE_FUSEX', login: 'chefe.fusex', descricao: 'Assina Guias e gerencia beneficiários e médicos.' },
  { perfil: 'SETOR_GUIAS', login: 'setor.guias', descricao: 'Analisa as pré-guias e anexa as Guias do SIRE.' },
  { perfil: 'RECEPCAO', login: 'recepcao', descricao: 'Imprime Guias concluídas.' },
]

export function acessoRapidoHabilitado(): boolean {
  return import.meta.env.DEV || import.meta.env.VITE_ACESSO_RAPIDO === 'true'
}
