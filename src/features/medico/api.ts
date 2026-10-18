/**
 * MOCK: o backend das telas do medico ainda nao existe.
 * Quando existir, troque o corpo de cada funcao por get/post de shared/api/http
 * (mantendo as assinaturas) e as telas nao mudam.
 * A lista de OCS NAO esta aqui: usa o listarOcs real de features/ocs/api.ts.
 */
import type {
  BeneficiarioEncontrado,
  CorrecaoPayload,
  PreGuiaCriada,
  PreGuiaMedicoPayload,
  PreGuiaParaCorrecao,
  ProcedimentoOpcao,
} from './types'

const espera = (ms = 300) => new Promise((r) => setTimeout(r, ms))

interface BeneficiarioMock {
  id: number
  nome: string
  precCp: string
  cpf: string
  dataNascimento: string
  telefone: string
}

const BENEFICIARIOS: BeneficiarioMock[] = [
  { id: 1, nome: 'Carlos Eduardo Menezes', precCp: '12345678900', cpf: '98765432100', dataNascimento: '1978-03-14', telefone: '(12) 99123-4567' },
  { id: 2, nome: 'Marta Aparecida Lopes', precCp: '98765432100', cpf: '11122233344', dataNascimento: '1952-11-02', telefone: '(12) 3653-1122' },
]

const PROCEDIMENTOS: ProcedimentoOpcao[] = [
  { id: 1, codigoTuss: '40304361', terminologiaProcedimento: 'Hemograma completo', rolAns: 'SIM', subgrupo: 'Hematologia' },
  { id: 2, codigoTuss: '40901114', terminologiaProcedimento: 'Ultrassonografia de abdome total', rolAns: 'SIM', subgrupo: 'Ultrassonografia' },
  { id: 3, codigoTuss: '41101049', terminologiaProcedimento: 'Ressonância magnética de joelho', rolAns: 'SIM', subgrupo: 'Ressonância magnética' },
  { id: 4, codigoTuss: '40808041', terminologiaProcedimento: 'Radiografia de tórax (PA e perfil)', rolAns: 'SIM', subgrupo: 'Radiologia' },
  { id: 5, codigoTuss: '20104375', terminologiaProcedimento: 'Sessão de acupuntura', rolAns: 'NAO', subgrupo: 'Terapias' },
]

function idadeDe(nascimentoIso: string, hoje = new Date()): string {
  const n = new Date(`${nascimentoIso}T00:00:00`)
  let idade = hoje.getFullYear() - n.getFullYear()
  if (hoje.getMonth() < n.getMonth() || (hoje.getMonth() === n.getMonth() && hoje.getDate() < n.getDate())) idade -= 1
  return String(idade)
}

function paraEncontrado(b: BeneficiarioMock): BeneficiarioEncontrado {
  return {
    id: b.id,
    dados: { nome: b.nome, idade: idadeDe(b.dataNascimento), precCp: b.precCp, cpf: b.cpf, telefone: b.telefone },
  }
}

/** GET /beneficiarios?precCp=... (devolve null se nao existir/ativo) */
export async function buscarBeneficiarioPorPrecCp(precCp: string): Promise<BeneficiarioEncontrado | null> {
  await espera()
  const alvo = precCp.replace(/\D/g, '')
  const achado = BENEFICIARIOS.find((b) => b.precCp === alvo)
  return achado ? paraEncontrado(achado) : null
}

/** GET /procedimentos?busca=... — catalogo inteiro, sem filtro por OCS (decisao do cliente). */
export async function buscarProcedimentos(termo: string): Promise<ProcedimentoOpcao[]> {
  await espera(200)
  const t = termo.trim().toLowerCase()
  return PROCEDIMENTOS.filter(
    (p) => p.codigoTuss.includes(t) || p.terminologiaProcedimento.toLowerCase().includes(t),
  )
}

/** POST /pre-guias/medico */
export async function criarPreGuiaMedico(_payload: PreGuiaMedicoPayload): Promise<PreGuiaCriada> {
  await espera(500)
  return { id: Math.floor(Math.random() * 9000) + 1000, status: 'PENDENTE' }
}

let PARA_CORRECAO: PreGuiaParaCorrecao[] = [
  {
    id: 1042,
    dataCriacao: '2026-10-09',
    beneficiario: paraEncontrado(BENEFICIARIOS[0]),
    ocsId: 1,
    procedimentos: [PROCEDIMENTOS[3]],
    observacao: 'Falta informar a incidência da radiografia de tórax. Revise os procedimentos.',
  },
  {
    id: 1047,
    dataCriacao: '2026-10-12',
    beneficiario: paraEncontrado(BENEFICIARIOS[1]),
    ocsId: 3,
    procedimentos: [PROCEDIMENTOS[0], PROCEDIMENTOS[1]],
    observacao: 'A OCS escolhida está com o contrato suspenso. Escolha outra OCS.',
  },
]

/** GET /pre-guias/para-correcao (o backend filtra: status ATENCAO e medico_id da sessao) */
export async function listarPreGuiasParaCorrecao(): Promise<PreGuiaParaCorrecao[]> {
  await espera()
  return [...PARA_CORRECAO]
}

/** PUT /pre-guias/{id}/correcao (volta para PENDENTE; so o medico emissor pode) */
export async function corrigirPreGuia(id: number, _payload: CorrecaoPayload): Promise<PreGuiaCriada> {
  await espera(400)
  PARA_CORRECAO = PARA_CORRECAO.filter((p) => p.id !== id)
  return { id, status: 'PENDENTE' }
}
