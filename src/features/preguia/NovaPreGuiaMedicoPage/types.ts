import type { BeneficiarioEncontrado, ProcedimentoOpcao } from '../../medico/types'

export interface NovaPreGuiaMedicoForm {
  beneficiario: BeneficiarioEncontrado | null
  ocsId: number | null
  procedimentos: ProcedimentoOpcao[]
}

export const formMedicoVazio: NovaPreGuiaMedicoForm = {
  beneficiario: null,
  ocsId: null,
  procedimentos: [],
}
