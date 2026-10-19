import { postForm } from '../../shared/api/http'

import type {
  Beneficiario,
  PreGuia,
} from '../../shared/types/domain'

import type {
  NovaPreGuiaForm,
} from './NovaPreGuiaPage/types'

function somenteDigitos(texto: string): string {
  return texto.replace(/\D/g, '')
}

export function criarPreGuia(
  form: NovaPreGuiaForm,
  beneficiario: Beneficiario,
): Promise<PreGuia> {
  const dados = new FormData()

  dados.append(
    'cpf',
    somenteDigitos(beneficiario.cpf),
  )

  dados.append(
    'precCp',
    somenteDigitos(beneficiario.precCp),
  )

  if (form.ocsId !== null) {
    dados.append('ocsId', String(form.ocsId))
  }

  if (form.arquivo) {
    dados.append('arquivo', form.arquivo)
  }

  return postForm<PreGuia>('/pre-guias', dados)
}
