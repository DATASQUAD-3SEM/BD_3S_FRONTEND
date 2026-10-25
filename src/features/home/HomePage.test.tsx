import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import HomePage from './HomePage'
import { CHAVE_LOGIN } from '../../shared/layout/perfis'

/**
 * Testes da pagina inicial de escolha de perfil (login simulado).
 */

describe('HomePage: escolha do perfil', () => {
  beforeEach(() => localStorage.clear())

  it('lista os cinco perfis', () => {
    render(
      <MemoryRouter>
        <HomePage />
      </MemoryRouter>,
    )
    for (const nome of ['Beneficiário', 'Médico FUSEX', 'Chefe do FUSEX', 'Setor de Guias', 'Recepção']) {
      expect(screen.getByRole('button', { name: new RegExp(nome) })).toBeInTheDocument()
    }
  })

  it('entrar como Setor de Guias grava o login do seed e abre a fila', async () => {
    const user = userEvent.setup()
    render(
      <MemoryRouter initialEntries={['/']}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/setor-guias/fila" element={<p>fila aberta</p>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /Setor de Guias/ }))

    expect(screen.getByText('fila aberta')).toBeInTheDocument()
    expect(localStorage.getItem(CHAVE_LOGIN)).toBe('setor.guias')
  })
})
