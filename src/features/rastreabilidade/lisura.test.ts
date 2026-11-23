import { describe, expect, it } from 'vitest'
import {
  comparacaoDaLinha,
  contratoDaLinha,
  errosDoRascunho,
  glosaDaLinha,
  gravaPreco,
  lerValor,
  pedidosDeLisura,
  resumoLisura,
  rascunhoInicial,
  type RascunhoLinha,
} from './lisura'
import type { LinhaLisura } from './types'

const tabela: LinhaLisura = {
  itemId: 1, guiaId: 10, guiaNumero: 'G-1', paciente: 'Ana', codigo: '40301', procedimento: 'Glicose',
  quantidadeSessoes: 1, valorSessao: 60, valorTotal: 60, valorContrato: 52, origemContrato: 'TABELA',
  observacao: null, glosa: null, comparacao: 'ACIMA',
}
const semPreco: LinhaLisura = {
  ...tabela, itemId: 2, guiaNumero: 'G-2', codigo: '99999', procedimento: 'Tomografia',
  quantidadeSessoes: 2, valorSessao: 100, valorTotal: 200, valorContrato: null, origemContrato: null,
}

const vazio: RascunhoLinha = { decisao: null, valor: '', corrigir: false, observacao: '' }

describe('lerValor', () => {
  it('aceita vírgula ou ponto e recusa vazio, negativo ou texto', () => {
    expect(lerValor('12,50')).toBe(12.5)
    expect(lerValor('12.5')).toBe(12.5)
    expect(lerValor('')).toBeNull()
    expect(lerValor('-1')).toBeNull()
    expect(lerValor('abc')).toBeNull()
  })
})

describe('linha da tabela', () => {
  it('usa o valor da tabela e calcula a glosa com sinal', () => {
    const contrato = contratoDaLinha(tabela, vazio)
    expect(contrato).toBe(52)
    expect(glosaDaLinha(tabela, contrato)).toBe(8)
    expect(comparacaoDaLinha(tabela, contrato)).toBe('ACIMA')
  })

  it('"O valor mudou?" com novo valor substitui o contrato', () => {
    const r = { ...vazio, corrigir: true, valor: '60' }
    expect(contratoDaLinha(tabela, r)).toBe(60)
    expect(glosaDaLinha(tabela, 60)).toBe(0)
    expect(comparacaoDaLinha(tabela, 60)).toBe('CONFORME')
  })

  it('diferença de um centavo já é glosa', () => {
    const l = { ...tabela, valorSessao: 52.01, quantidadeSessoes: 1 }
    expect(glosaDaLinha(l, 52)).toBe(0.01)
  })
})

describe('linha sem preço na tabela', () => {
  it('Sim: contrato igual ao informado, glosa zero', () => {
    const r = { ...vazio, decisao: 'sim' as const }
    expect(contratoDaLinha(semPreco, r)).toBe(100)
    expect(glosaDaLinha(semPreco, 100)).toBe(0)
  })

  it('Não com valor: glosa multiplicada pela quantidade, com sinal negativo quando cobrou a menos', () => {
    const r = { ...vazio, decisao: 'nao' as const, valor: '150' }
    const contrato = contratoDaLinha(semPreco, r)
    expect(glosaDaLinha(semPreco, contrato)).toBe(-100)
    expect(comparacaoDaLinha(semPreco, contrato)).toBe('ABAIXO')
  })

  it('sem decisão: sem contrato e sem glosa', () => {
    expect(contratoDaLinha(semPreco, vazio)).toBeNull()
    expect(comparacaoDaLinha(semPreco, null)).toBe('SEM_CONTRATO')
  })
})

describe('resumo e envio', () => {
  it('linha com tabela já conta como decidida; linha sem decisão deixa o resumo parcial', () => {
    const resumo = resumoLisura([tabela, semPreco], { 1: vazio, 2: vazio })
    expect(resumo.informado).toBe(260)
    expect(resumo.decididas).toBe(1)
    expect(resumo.valorFinal).toBe(52)
    expect(resumo.parcial).toBe(true)

    const completo = resumoLisura([tabela, semPreco], { 1: vazio, 2: { ...vazio, decisao: 'sim' as const } })
    expect(completo.parcial).toBe(false)
  })

  it('exige responsável só quando algum preço é gravado na tabela', () => {
    expect(gravaPreco([tabela, semPreco], { 1: vazio, 2: { ...vazio, decisao: 'sim' as const } })).toBe(false)
    expect(gravaPreco([tabela, semPreco], { 1: vazio, 2: { ...vazio, decisao: 'nao' as const, valor: '150' } })).toBe(true)
  })

  it('monta o PUT só com as decisões de cada linha', () => {
    const rascunhos = {
      1: vazio,
      2: { ...vazio, decisao: 'nao' as const, valor: '150', observacao: '  Exame particular  ' },
    }
    expect(pedidosDeLisura([tabela, semPreco], rascunhos)).toEqual([
      { itemId: 1, corrigirTabela: false, valorContrato: null, observacao: null },
      { itemId: 2, conforme: false, valorContrato: 150, observacao: 'Exame particular' },
    ])
  })

  it('recusa observação acima de 500 caracteres e valor de contrato inválido', () => {
    const erros = errosDoRascunho([semPreco], { 2: { ...vazio, decisao: 'nao' as const, valor: '', observacao: 'x'.repeat(501) } })
    expect(erros).toHaveLength(2)
  })

  it('estado inicial reflete a origem do contrato salvo', () => {
    expect(rascunhoInicial({ ...semPreco, origemContrato: 'CONFERIDO' }).decisao).toBe('sim')
    expect(rascunhoInicial({ ...semPreco, origemContrato: 'MANUAL', valorContrato: 150 })).toMatchObject({ decisao: 'nao', valor: '150' })
    expect(rascunhoInicial({ ...tabela, origemContrato: 'TABELA_CORRIGIDA', valorContrato: 60 })).toMatchObject({ corrigir: true, valor: '60' })
  })
})
