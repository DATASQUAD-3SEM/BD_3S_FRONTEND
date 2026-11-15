import { ApiError } from '../../shared/api/http'
import type {
  AssinaturaLoteResultado,
  AssinaturaRegistrada,
  GuiaParaAssinar,
  GuiasParaAssinarApi,
  PapelAssinatura,
} from './types'

/**
 * Implementacao em memoria do contrato T5-BE1 a T5-BE3 para o perfil informado (medico ou chefe).
 */

export type CenarioLoteMock = 'sucesso' | 'parcial' | 'erro-400' | 'erro-403' | 'erro-429' | 'erro-5xx'

const ATRASO_MS = 300
const PDF_MOCK = '%PDF-1.4\n% Guia de encaminhamento (mock)\n%%EOF'
const espera = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const GUIAS_MEDICO_MOCK: GuiaParaAssinar[] = [
  { guiaId: 21, numero: '202610721', beneficiarioNome: 'Mariana Teixeira', pendencias: ['MEDICO'] },
  { guiaId: 22, numero: '202610722', beneficiarioNome: 'Gustavo Nunes', pendencias: ['MEDICO'] },
  { guiaId: 23, numero: '202610723', beneficiarioNome: 'Vitória Almeida', pendencias: ['MEDICO'] },
  { guiaId: 24, numero: '202610724', beneficiarioNome: 'Caio Ribeiro', pendencias: ['MEDICO'] },
  { guiaId: 25, numero: '202610725', beneficiarioNome: 'Beatriz Monteiro', pendencias: ['MEDICO'] },
  { guiaId: 26, numero: '202610726', beneficiarioNome: 'Thiago Barbosa', pendencias: ['MEDICO'] },
]

// Seis Guias pendentes do chefe: tres ja com assinatura medica e tres sem
export const GUIAS_CHEFE_MOCK: GuiaParaAssinar[] = [
  { guiaId: 11, numero: '202610711', beneficiarioNome: 'Carla Mendes Rocha', pendencias: ['CHEFE'] },
  { guiaId: 12, numero: '202610712', beneficiarioNome: 'Paulo Henrique Dias', pendencias: ['CHEFE'] },
  { guiaId: 13, numero: '202610713', beneficiarioNome: 'Luana Ferreira Costa', pendencias: ['CHEFE'] },
  { guiaId: 14, numero: '202610714', beneficiarioNome: 'Rodrigo Tavares', pendencias: ['MEDICO', 'CHEFE'] },
  { guiaId: 15, numero: '202610715', beneficiarioNome: 'Fernanda Lopes', pendencias: ['MEDICO', 'CHEFE'] },
  { guiaId: 16, numero: '202610716', beneficiarioNome: 'Bruno Carvalho', pendencias: ['MEDICO', 'CHEFE'] },
]

export function criarGuiasParaAssinarMock(
  perfil: PapelAssinatura,
  guiasIniciais: GuiaParaAssinar[] = GUIAS_MEDICO_MOCK,
  cenarioLote: CenarioLoteMock = 'sucesso',
): GuiasParaAssinarApi {
  const guias: GuiaParaAssinar[] = guiasIniciais.map((g) => ({ ...g, pendencias: [...g.pendencias] }))
  const encontrar = (guiaId: number) => guias.find((g) => g.guiaId === guiaId)
  const motivoJaAssinada = perfil === 'MEDICO' ? 'ja_assinada_por_medico' : 'ja_assinada_pelo_chefe'

  return {
    async listar() {
      await espera(ATRASO_MS)
      return guias
        .filter((g) => g.pendencias.includes(perfil))
        .map((g) => ({ ...g, pendencias: [...g.pendencias] }))
    },

    async obterPdf(guiaId) {
      await espera(ATRASO_MS)
      if (!encontrar(guiaId)) throw new ApiError(404, 'Guia não encontrada')
      return new Blob([PDF_MOCK], { type: 'application/pdf' })
    },

    async assinar(guiaId): Promise<AssinaturaRegistrada> {
      await espera(ATRASO_MS)
      const guia = encontrar(guiaId)
      if (!guia) throw new ApiError(404, 'Guia não encontrada')
      if (!guia.pendencias.includes(perfil)) {
        throw new ApiError(409, 'Esta Guia já foi assinada por este papel')
      }
      guia.pendencias = guia.pendencias.filter((p) => p !== perfil)
      const assinados = (['MEDICO', 'CHEFE'] as const).filter((p) => !guia.pendencias.includes(p))
      return { assinaturas: [...assinados], concluida: guia.pendencias.length === 0 }
    },

    async assinarLote(guiaIds): Promise<AssinaturaLoteResultado> {
      await espera(ATRASO_MS)
      if (cenarioLote === 'erro-400') throw new ApiError(400, 'Dados inválidos')
      if (cenarioLote === 'erro-403') throw new ApiError(403, 'Acesso negado')
      if (cenarioLote === 'erro-429') throw new ApiError(429, 'Muitas tentativas')
      if (cenarioLote === 'erro-5xx') throw new ApiError(500, 'Erro interno')

      const ultimaId = guiaIds[guiaIds.length - 1]
      const assinadas: number[] = []
      const falhas: AssinaturaLoteResultado['falhas'] = []
      for (const guiaId of guiaIds) {
        const guia = encontrar(guiaId)
        if (!guia) {
          falhas.push({ guiaId, motivo: 'guia_nao_encontrada' })
        } else if (cenarioLote === 'parcial' && guiaId === ultimaId) {
          guia.pendencias = guia.pendencias.filter((p) => p !== perfil)
          falhas.push({ guiaId, motivo: motivoJaAssinada })
        } else if (!guia.pendencias.includes(perfil)) {
          falhas.push({ guiaId, motivo: motivoJaAssinada })
        } else {
          guia.pendencias = guia.pendencias.filter((p) => p !== perfil)
          assinadas.push(guiaId)
        }
      }
      return { assinadas, falhas }
    },
  }
}
