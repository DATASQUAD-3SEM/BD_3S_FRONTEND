import type { FaturaLisuraDetalhe, ItemLisuraPedido, LinhaLisura } from './types'

export const OBSERVACAO_MAXIMO = 500

/** Decisão do lisurador para uma linha SEM preço na tabela: Sim (conferido), Não (digita o contrato) ou nenhuma. */
export type Decisao = 'sim' | 'nao' | null

/** Estado editável de uma linha. Só existe enquanto a fatura está Em lisura. */
export interface RascunhoLinha {
  decisao: Decisao;
  /** Valor digitado (contrato por sessão), em texto para aceitar vírgula. Vazio = não informado. */
  valor: string;
  /** Linha com preço na tabela: "O valor mudou?" aberto e corrigindo o preço. */
  corrigir: boolean;
  observacao: string;
}

/** Texto em valor monetário aceito com vírgula ou ponto. Retorna null se não for um valor >= 0. */
export function lerValor(texto: string): number | null {
  const limpo = texto.trim().replace(',', '.')
  if (limpo === '') return null
  const numero = Number(limpo)
  return Number.isFinite(numero) && numero >= 0 ? numero : null
}

export function rascunhoInicial(linha: LinhaLisura): RascunhoLinha {
  const observacao = linha.observacao ?? ''
  switch (linha.origemContrato) {
    case 'TABELA':
      return { decisao: null, valor: '', corrigir: false, observacao }
    case 'TABELA_CORRIGIDA':
      return {
        decisao: null,
        valor: linha.valorContrato == null ? '' : String(linha.valorContrato),
        corrigir: true,
        observacao,
      }
    case 'CONFERIDO':
      return { decisao: 'sim', valor: '', corrigir: false, observacao }
    case 'MANUAL':
      return {
        decisao: 'nao',
        valor: linha.valorContrato == null ? '' : String(linha.valorContrato),
        corrigir: false,
        observacao,
      }
    default:
      return { decisao: null, valor: '', corrigir: false, observacao }
  }
}

/** Linha com preço na tabela: a comparação é automática (o lisurador só corrige, se quiser). */
export function daTabela(linha: LinhaLisura): boolean {
  return linha.origemContrato === 'TABELA' || linha.origemContrato === 'TABELA_CORRIGIDA'
}

/** Contrato efetivo da linha a partir do rascunho; null enquanto a linha não tem decisão. */
export function contratoDaLinha(linha: LinhaLisura, rascunho: RascunhoLinha): number | null {
  if (daTabela(linha)) {
    if (rascunho.corrigir) {
      const valor = lerValor(rascunho.valor)
      if (valor !== null) return valor
    }
    return linha.valorContrato
  }
  if (rascunho.decisao === 'sim') return linha.valorSessao
  if (rascunho.decisao === 'nao') return lerValor(rascunho.valor)
  return null
}

/** Glosa = (informado − contrato) × quantidade, com sinal. Null enquanto não há contrato. */
export function glosaDaLinha(linha: LinhaLisura, contrato: number | null): number | null {
  if (contrato === null) return null
  return round2((linha.valorSessao - contrato) * linha.quantidadeSessoes)
}

export function comparacaoDaLinha(linha: LinhaLisura, contrato: number | null): LinhaLisura['comparacao'] {
  if (contrato === null) return 'SEM_CONTRATO'
  if (linha.valorSessao === contrato) return 'CONFORME'
  return linha.valorSessao > contrato ? 'ACIMA' : 'ABAIXO'
}

export interface ResumoLisura {
  informado: number;
  glosa: number;
  valorFinal: number;
  decididas: number;
  total: number;
  parcial: boolean;
}

/** Resumo e rodapé: soma das linhas decididas; "parcial" enquanto houver linha sem decisão. */
export function resumoLisura(linhas: LinhaLisura[], rascunhos: Record<number, RascunhoLinha>): ResumoLisura {
  let informado = 0
  let glosa = 0
  let valorFinal = 0
  let decididas = 0
  for (const linha of linhas) {
    informado += linha.valorTotal
    const contrato = contratoDaLinha(linha, rascunhos[linha.itemId])
    if (contrato === null) continue
    decididas += 1
    glosa += glosaDaLinha(linha, contrato) ?? 0
    valorFinal += contrato * linha.quantidadeSessoes
  }
  return {
    informado: round2(informado),
    glosa: round2(glosa),
    valorFinal: round2(valorFinal),
    decididas,
    total: linhas.length,
    parcial: decididas < linhas.length,
  }
}

/** Precisa do nome do responsável: a lisura grava preço na tabela da OCS (regra 12.3). */
export function gravaPreco(linhas: LinhaLisura[], rascunhos: Record<number, RascunhoLinha>): boolean {
  return linhas.some((linha) => {
    const r = rascunhos[linha.itemId]
    if (!r) return false
    if (daTabela(linha)) return r.corrigir && lerValor(r.valor) !== null
    return r.decisao === 'nao' && lerValor(r.valor) !== null
  })
}

/** Erros que impedem salvar: valor de correção ou de contrato inválido, observação longa. */
export function errosDoRascunho(linhas: LinhaLisura[], rascunhos: Record<number, RascunhoLinha>): string[] {
  const erros: string[] = []
  for (const linha of linhas) {
    const r = rascunhos[linha.itemId]
    if (!r) continue
    if (r.observacao.length > OBSERVACAO_MAXIMO) {
      erros.push(`A observação da Guia ${linha.guiaNumero} aceita no máximo ${OBSERVACAO_MAXIMO} caracteres.`)
    }
    const precisaValor = daTabela(linha) ? r.corrigir : r.decisao === 'nao'
    if (precisaValor && lerValor(r.valor) === null) {
      erros.push(`Informe um valor de contrato válido para a Guia ${linha.guiaNumero}.`)
    }
  }
  return erros
}

/** Itens do PUT de lisura, só com o que o lisurador decidiu. */
export function pedidosDeLisura(linhas: LinhaLisura[], rascunhos: Record<number, RascunhoLinha>): ItemLisuraPedido[] {
  return linhas.map((linha) => {
    const r = rascunhos[linha.itemId]
    const observacao = r.observacao.trim() === '' ? null : r.observacao.trim()
    if (daTabela(linha)) {
      const valor = r.corrigir ? lerValor(r.valor) : null
      return {
        itemId: linha.itemId,
        corrigirTabela: r.corrigir && valor !== null,
        valorContrato: valor,
        observacao,
      }
    }
    const valor = r.decisao === 'nao' ? lerValor(r.valor) : null
    return {
      itemId: linha.itemId,
      conforme: r.decisao === 'sim' ? true : r.decisao === 'nao' ? false : null,
      valorContrato: valor,
      observacao,
    }
  })
}

/** Rascunhos iniciais de todas as linhas de uma fatura. */
export function rascunhosIniciais(fatura: FaturaLisuraDetalhe): Record<number, RascunhoLinha> {
  return Object.fromEntries(fatura.linhas.map((linha) => [linha.itemId, rascunhoInicial(linha)]))
}

function round2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}
