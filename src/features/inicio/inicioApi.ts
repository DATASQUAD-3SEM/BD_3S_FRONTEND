import { ApiError, get } from '../../shared/api/http'
import { lerSessao } from '../../shared/auth/sessao'
import { minhasGuiasApi } from '../minhasGuias/api'
import type { GuiaDoBeneficiario } from '../minhasGuias/types'
import { minhasPreGuiasApi } from '../minhasPreGuias/api'
import type { PreGuiaDoBeneficiario } from '../minhasPreGuias/types'

/**
 * T35-FE1: dados da página Início da área do beneficiário. Usa só endpoints que já existem:
 * GET /beneficiarios/me/pre-guias, GET /guias/minhas e, para saber quem é a pessoa e se ela já tem assinatura,
 * GET /beneficiarios/me (titular), GET /dependente/me (dependente maior) ou GET /responsavel/me (responsável legal).
 */

export type TipoPessoaInicio = 'TITULAR' | 'DEPENDENTE_MAIOR' | 'RESPONSAVEL'

export interface PessoaInicio {
  tipo: TipoPessoaInicio
  nome: string
  temAssinatura: boolean
}

export interface InicioApi {
  pessoa(): Promise<PessoaInicio>
  preGuias(): Promise<PreGuiaDoBeneficiario[]>
  guias(): Promise<GuiaDoBeneficiario[]>
}

interface BeneficiarioMe {
  nome: string
  assinaturaCadastrada: boolean
}

interface OutroMe {
  nome: string | null
  temAssinatura: boolean
}

async function pessoaLogada(): Promise<PessoaInicio> {
  if (lerSessao()?.perfil === 'RESPONSAVEL_EXTERNO') {
    const r = await get<OutroMe>('/responsavel/me')
    return { tipo: 'RESPONSAVEL', nome: r.nome ?? '', temAssinatura: r.temAssinatura }
  }
  try {
    const b = await get<BeneficiarioMe>('/beneficiarios/me')
    return { tipo: 'TITULAR', nome: b.nome, temAssinatura: b.assinaturaCadastrada }
  } catch (erro) {
    // Dependente maior entra com o perfil BENEFICIARIO, mas não tem cadastro de titular (404).
    if (!(erro instanceof ApiError) || erro.status !== 404) throw erro
    const d = await get<OutroMe>('/dependente/me')
    return { tipo: 'DEPENDENTE_MAIOR', nome: d.nome ?? '', temAssinatura: d.temAssinatura }
  }
}

export const inicioApi: InicioApi = {
  pessoa: pessoaLogada,
  preGuias: () => minhasPreGuiasApi.listar(),
  guias: () => minhasGuiasApi.listar(),
}
