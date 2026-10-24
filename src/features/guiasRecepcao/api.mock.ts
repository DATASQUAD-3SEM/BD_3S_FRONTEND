import { ApiError } from '../../shared/api/http'
import type { GuiaRecepcao, GuiasRecepcaoApi } from './types'

export const guiasMock: GuiaRecepcao[] = [
  {
    guiaId: 2,
    numero: '202610655',
    beneficiarioNome: 'Antonio Carlos Ferreira',
    precCp: '45872213300',
    ocsNome: 'Laboratório Exemplo',
    validadeAte: '2026-11-20',
  },
  {
    guiaId: 1,
    numero: '202610701',
    beneficiarioNome: 'Antonio Carlos Ferreira',
    precCp: '45872213300',
    ocsNome: 'Hospital Exemplo',
    validadeAte: '2026-12-01',
  },
]

const PDF_MOCK = '%PDF-1.4\n% Guia de encaminhamento (mock)\n%%EOF'

const semAcento = (texto: string) =>
  texto.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase().trim()
const digitos = (texto: string) => texto.replace(/\D/g, '')
const espera = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

export const guiasRecepcaoMockApi: GuiasRecepcaoApi = {
  async buscar(busca: string): Promise<GuiaRecepcao[]> {
    await espera(250)
    const termo = semAcento(busca)
    if (termo.length < 3) {
      throw new ApiError(400, 'Informe ao menos 3 caracteres para buscar')
    }
    const termoDigitos = digitos(busca)
    return guiasMock.filter(
      (g) =>
        semAcento(g.beneficiarioNome).includes(termo) ||
        g.numero.includes(termo) ||
        (termoDigitos !== '' && digitos(g.precCp).includes(termoDigitos)),
    )
  },

  async obterPdf(guiaId: number): Promise<Blob> {
    await espera(250)
    if (!guiasMock.some((g) => g.guiaId === guiaId)) {
      throw new ApiError(404, 'Guia não encontrada')
    }
    return new Blob([PDF_MOCK], { type: 'application/pdf' })
  },
}
