import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { BeneficiarioProvider } from './BeneficiarioContext'
import BeneficiarioMyInfoPage from './BeneficiarioMyInfoPage'
import { reiniciarEstadoMock } from './dadosBeneficiario'
import {
  MinhasInformacoesDependenteMaior,
  MinhasInformacoesResponsavel,
  type MinhasInformacoesOutrosApi,
} from './MinhasInformacoesOutros'
import { MedicoProvider } from '../medicoFusex/MedicoContext'
import MedicoMyInfoPage from '../medicoFusex/MedicoMyInfoPage'
import { reiniciarEstadoMockMedico } from '../medicoFusex/dadosMedico'
import { ChefeProvider } from '../chefeFusex/ChefeContext'
import ChefeMyInfoPage from '../chefeFusex/ChefeMyInfoPage'
import { reiniciarEstadoMockChefe } from '../chefeFusex/dadosChefe'

/**
 * T37-FE1: a pre-visualizacao da assinatura atual usa a mesma area (3:1, imagem inteira, sem esticar)
 * nas cinco telas de Minhas informacoes: beneficiario, dependente maior, responsavel legal, medico e chefe.
 */

const ESPERA = { timeout: 3000 }

function jsonResponse(corpo: unknown): Response {
  return new Response(JSON.stringify(corpo), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  })
}

function apiOutros(): MinhasInformacoesOutrosApi {
  return {
    responsavel: vi.fn().mockResolvedValue({ nome: 'Helena Costa', cpf: '41282945067', temAssinatura: true }),
    menores: vi.fn().mockResolvedValue([]),
    dependente: vi.fn().mockResolvedValue({
      nome: 'Carla Ferreira', precCp: '12345678901', vinculo: 'Cônjuge', vigenciaFim: null, vigente: true,
      titularNome: 'Antonio Ferreira', temAssinatura: true,
    }),
    salvarAssinatura: vi.fn().mockResolvedValue(undefined),
  }
}

const TELAS: Array<[string, () => React.ReactElement]> = [
  [
    'beneficiário',
    () => (
      <BeneficiarioProvider>
        <BeneficiarioMyInfoPage />
      </BeneficiarioProvider>
    ),
  ],
  [
    'dependente maior',
    () => (
      <MemoryRouter>
        <MinhasInformacoesDependenteMaior api={apiOutros()} />
      </MemoryRouter>
    ),
  ],
  [
    'responsável legal',
    () => (
      <MemoryRouter>
        <MinhasInformacoesResponsavel api={apiOutros()} />
      </MemoryRouter>
    ),
  ],
  [
    'médico',
    () => (
      <MedicoProvider>
        <MedicoMyInfoPage />
      </MedicoProvider>
    ),
  ],
  [
    'chefe',
    () => (
      <ChefeProvider>
        <ChefeMyInfoPage />
      </ChefeProvider>
    ),
  ],
]

beforeEach(() => {
  reiniciarEstadoMock()
  reiniciarEstadoMockMedico()
  reiniciarEstadoMockChefe()

  // O jsdom nao tem createObjectURL/revokeObjectURL.
  URL.createObjectURL = vi.fn(() => 'blob:assinatura-atual')
  URL.revokeObjectURL = vi.fn()

  vi.stubGlobal(
    'fetch',
    vi.fn().mockImplementation((url: string, init?: RequestInit) => {
      const chave = `${init?.method ?? 'GET'} ${url}`

      if (chave === 'GET /api/usuarios/me/assinatura') {
        return Promise.resolve(
          new Response(new Uint8Array([137, 80, 78, 71]), {
            status: 200,
            headers: { 'Content-Type': 'image/png' },
          }),
        )
      }
      if (chave === 'GET /api/beneficiarios/me') {
        return Promise.resolve(
          jsonResponse({
            nome: 'Antonio Carlos',
            cpf: '12345678900',
            precCp: '45872213300',
            telefone: '(12) 98765-4321',
            dataNascimento: '1978-05-10',
            assinaturaCadastrada: true,
          }),
        )
      }
      if (chave === 'GET /api/medicos/me/perfil') {
        return Promise.resolve(
          jsonResponse({
            nome: 'Carlos Eduardo Lima',
            patente: 'Capitão Médico',
            cpf: '11144477735',
            precCp: '11122233344',
            crm: '123456-SP',
            assinaturaCadastrada: true,
          }),
        )
      }
      if (chave === 'GET /api/chefe/me') {
        return Promise.resolve(
          jsonResponse({ nome: 'Chefe do FUSEX', patente: 'Coronel', login: 'chefe.fusex', assinaturaCadastrada: true }),
        )
      }
      return Promise.resolve(new Response('', { status: 404 }))
    }),
  )
})

afterEach(() => vi.unstubAllGlobals())

describe('Pré-visualização da assinatura nas telas de Minhas informações (T37-FE1)', () => {
  it.each(TELAS)('%s: mostra a assinatura atual na área fixa de pré-visualização', async (_nome, tela) => {
    render(tela())

    const imagem = await screen.findByAltText('Assinatura atual cadastrada', {}, ESPERA)
    expect(imagem).toHaveAttribute('src', 'blob:assinatura-atual')

    const area = screen.getByLabelText('Pré-visualização da assinatura atual')
    expect(area).toHaveClass('info-previa-assinatura')
    expect(area).toContainElement(imagem)
    expect(vi.mocked(fetch)).toHaveBeenCalledWith('/api/usuarios/me/assinatura', expect.anything())
  })
})
