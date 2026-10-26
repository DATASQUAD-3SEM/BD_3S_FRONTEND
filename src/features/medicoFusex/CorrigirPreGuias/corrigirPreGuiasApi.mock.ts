import type { CorrigirPreGuiasApi, PreGuiaParaCorrigir } from './types'

/**
 * Implementacao em memoria do contrato T14-BE1 (lista de pre-guias para corrigir).
 */

const LISTA: PreGuiaParaCorrigir[] = [
  {
    id: 405,
    numero: '0405',
    beneficiarioNome: 'Marta Souza Lima',
    precCp: '45810020001',
    ocsNome: 'Laboratório Exemplo',
    dataCriacao: '2026-10-08',
    observacao: 'Hemograma completo informado em duplicidade. Favor revisar a lista de exames.',
  },
  {
    id: 406,
    numero: '0406',
    beneficiarioNome: 'Carlos Henrique Dias',
    precCp: '45810031102',
    ocsNome: 'Clínica Modelo',
    dataCriacao: '2026-10-12',
    observacao: 'Número da OCS não confere com o contrato vigente.',
  },
]

export const corrigirPreGuiasMock: CorrigirPreGuiasApi = {
  listarParaCorrigir() {
    return Promise.resolve(LISTA.map((item) => ({ ...item })))
  },
}
