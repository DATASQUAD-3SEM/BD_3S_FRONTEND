import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import RevisaoResumoMedico from './RevisaoResumoMedico'
import { formMedicoVazio, type NovaPreGuiaMedicoForm } from '../types'

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

afterEach(() => vi.unstubAllGlobals())

const beneficiario = {
  id: 1,
  dados: { nome: 'Carlos Menezes', idade: '48', precCp: '12345678900', cpf: '98765432100', telefone: '1299' },
}

const hemograma = {
  id: 1, codigoTuss: '40304361', terminologiaProcedimento: 'Hemograma completo', rolAns: 'SIM' as const, subgrupo: 'Hematologia',
}

describe('RevisaoResumoMedico', () => {
  it('mostra avisos quando nada foi preenchido ainda', () => {
    render(<RevisaoResumoMedico form={formMedicoVazio} />)

    expect(screen.getByText('Nenhum beneficiário selecionado ainda.')).toBeInTheDocument()
    expect(screen.getByText('Nenhuma OCS selecionada ainda.')).toBeInTheDocument()
    expect(screen.getByText('Nenhum procedimento adicionado ainda.')).toBeInTheDocument()
  })

  it('mostra o beneficiário quando selecionado', () => {
    const form: NovaPreGuiaMedicoForm = { ...formMedicoVazio, beneficiario }
    render(<RevisaoResumoMedico form={form} />)

    expect(screen.getByText(/Carlos Menezes/)).toBeInTheDocument()
    expect(screen.getByText(/Prec-CP:\s*12345678900/)).toBeInTheDocument()
  })

  it('busca e mostra o nome da OCS escolhida', async () => {
    const fetchMock = vi.fn().mockResolvedValue(
      respostaJson([
        {
          id: 1, contratoNum: 'c1', nome: 'OCS Exemplo', tipo: null,
          inicioVigencia: null, terminoVigencia: null, diasParaVencimento: null,
        },
      ]),
    )
    vi.stubGlobal('fetch', fetchMock)

    render(<RevisaoResumoMedico form={{ ...formMedicoVazio, ocsId: 1 }} />)

    expect(await screen.findByText('OCS Exemplo')).toBeInTheDocument()
  })

  it('lista os procedimentos com o código TUSS', () => {
    const form: NovaPreGuiaMedicoForm = { ...formMedicoVazio, procedimentos: [hemograma] }
    render(<RevisaoResumoMedico form={form} />)

    expect(screen.getByText(/Hemograma completo \(TUSS 40304361\)/)).toBeInTheDocument()
  })

  it('não quebra a tela quando a API de OCS falha', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new TypeError('Failed to fetch')))

    render(<RevisaoResumoMedico form={{ ...formMedicoVazio, ocsId: 5 }} />)

    expect(await screen.findByText(/OCS #5/)).toBeInTheDocument()
  })

  it('não possui campos editáveis (somente leitura)', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson([])))

    const form: NovaPreGuiaMedicoForm = { beneficiario, ocsId: 1, procedimentos: [hemograma] }
    render(<RevisaoResumoMedico form={form} />)

    await screen.findByText(/OCS #1/)
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
