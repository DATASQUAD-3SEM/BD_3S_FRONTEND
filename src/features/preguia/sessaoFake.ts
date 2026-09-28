/**
 * Sprint 1: ainda nao existe login/JWT. Este arquivo devolve os dados de um
 * beneficiario fixo (mesmo cadastro do seed `db/seed/R__dados_exemplo.sql`)
 * para simular a sessao do beneficiario logado.
 *
 * Sprint 2 (US7/US8): trocar este objeto por uma chamada autenticada a
 * `GET /beneficiarios/me`. Nada mais no app precisa mudar — so este arquivo.
 */
export const beneficiarioLogado = {
  nome: 'Antonio Carlos Ferreira',
  idade: '58',
  precCp: '45872213300',
  cpf: '12345678900',
  telefone: '(12) 98765-4321',
} as const
