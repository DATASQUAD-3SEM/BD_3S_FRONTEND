import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import AppLayout from './AppLayout'
import { salvarSessao } from '../auth/sessao'

/** T30-FE3: nome do usuário na barra superior da área do beneficiário. */

function respostaJson(corpo: unknown, status = 200) {
  return new Response(JSON.stringify(corpo), { status, headers: { 'Content-Type': 'application/json' } })
}

function renderizar() {
  return render(
    <MemoryRouter initialEntries={['/guias']}>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="*" element={<p>conteúdo</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

afterEach(() => {
  localStorage.clear()
  vi.unstubAllGlobals()
})

describe('AppLayout (T30-FE3)', () => {
  it('responsável legal: "[nome] · Responsável legal", com o nome de /responsavel/me', async () => {
    salvarSessao({ login: '41282945067', perfil: 'RESPONSAVEL_EXTERNO', nome: '41282945067' })
    const fetchMock = vi.fn().mockResolvedValue(
      respostaJson({ nome: 'Helena Costa', cpf: '41282945067', temAssinatura: false }),
    )
    vi.stubGlobal('fetch', fetchMock)

    renderizar()

    expect(await screen.findByText('Helena Costa · Responsável legal')).toBeInTheDocument()
    expect(fetchMock.mock.calls.map((c) => c[0])).toEqual(['/api/responsavel/me'])
  })

  it('responsável legal sem nome na resposta: só "Responsável legal", sem o CPF', async () => {
    salvarSessao({ login: '41282945067', perfil: 'RESPONSAVEL_EXTERNO', nome: '41282945067' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson({ nome: null, cpf: '41282945067', temAssinatura: false })))

    renderizar()

    expect(await screen.findByText('Responsável legal')).toBeInTheDocument()
    expect(screen.queryByText(/41282945067/)).not.toBeInTheDocument()
  })

  it('dependente maior (sem cadastro de titular): usa o nome devolvido no login', async () => {
    salvarSessao({ login: '98765432100', perfil: 'BENEFICIARIO', nome: 'Carla Ferreira' })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(respostaJson({ status: 404, mensagem: 'Beneficiario nao encontrado' }, 404)))

    renderizar()

    expect(await screen.findByText('Carla Ferreira · Beneficiário')).toBeInTheDocument()
  })
})
