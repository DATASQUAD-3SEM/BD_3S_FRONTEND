import type {
  CorrecaoApi,
  DetalheCorrecao,
  OcsResumo,
  ProcedimentoResumo,
} from './correcaoTipos'

const OCS: OcsResumo[] = [
  { id: 1, nome: 'Laboratório Exemplo', contrato: 'EXEMPLO-001', tipo: 'LABORATÓRIO' },
  { id: 2, nome: 'Clínica Modelo', contrato: 'MODELO-002', tipo: 'CLÍNICA' },
]

const EXAMES: ProcedimentoResumo[] = [
  { codigoTuss: '40304361', nome: 'Hemograma completo' },
  { codigoTuss: '40301630', nome: 'Glicose' },
  { codigoTuss: '40302040', nome: 'Colesterol total' },
]

const DETALHE: DetalheCorrecao = {
  id: 405,
  numero: '0405',
  status: 'ATENCAO',
  beneficiario: {
    nome: 'Marta Souza Lima',
    precCp: '45810020001',
    faixaEtaria: '41 a 50',
    telefone: '(12) 91234-5678',
  },
  ocsAtual: OCS[0],
  procedimentos: [EXAMES[0], EXAMES[1]],
  observacao: {
    texto: 'Hemograma completo informado em duplicidade. Favor revisar a lista de exames.',
    dataRegistro: '2026-10-11',
  },
}

export const correcaoMock: CorrecaoApi = {
  async detalhar(id) {
    return { ...DETALHE, id, procedimentos: [...DETALHE.procedimentos] }
  },

  async buscarOcs(busca) {
    const termo = busca.trim().toLowerCase()
    const resultados = OCS.filter((o) =>
      [o.nome, o.contrato, o.tipo].some((v) => v.toLowerCase().includes(termo)),
    )
    return { resultados, total: resultados.length }
  },

  async buscarProcedimentos(busca) {
    const termo = busca.trim().toLowerCase()
    return EXAMES.filter(
      (e) => e.nome.toLowerCase().includes(termo) || e.codigoTuss.includes(termo),
    )
  },

  async salvarCorrecao() {
    return { status: 'PENDENTE', dataReenvio: new Date().toISOString() }
  },
}
