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

const ATRASO_MS = 300
const PDF_MOCK = '%PDF-1.4\n% Guia de encaminhamento (mock)\n%%EOF'
const espera = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const GUIAS_INICIAIS: GuiaParaAssinar[] = [
  { guiaId: 1, numero: '202610701', beneficiarioNome: 'Marta Souza Lima', pendencias: ['MEDICO', 'CHEFE'] },
  { guiaId: 2, numero: '202610699', beneficiarioNome: 'João Pereira Alves', pendencias: ['CHEFE'] },
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
  guiasIniciais: GuiaParaAssinar[] = GUIAS_INICIAIS,
): GuiasParaAssinarApi {
  const guias: GuiaParaAssinar[] = guiasIniciais.map((g) => ({ ...g, pendencias: [...g.pendencias] }))
  const encontrar = (guiaId: number) => guias.find((g) => g.guiaId === guiaId)

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
      const assinadas: number[] = []
      const falhas: AssinaturaLoteResultado['falhas'] = []
      for (const guiaId of guiaIds) {
        const guia = encontrar(guiaId)
        if (!guia) {
          falhas.push({ guiaId, motivo: 'guia_nao_encontrada' })
        } else if (!guia.pendencias.includes(perfil)) {
          falhas.push({ guiaId, motivo: perfil === 'CHEFE' ? 'ja_assinada_pelo_chefe' : 'ja_assinada_pelo_usuario' })
        } else {
          guia.pendencias = guia.pendencias.filter((p) => p !== perfil)
          assinadas.push(guiaId)
        }
      }
      return { assinadas, falhas }
    },
  }
}
