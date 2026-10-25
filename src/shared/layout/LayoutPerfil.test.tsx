import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import LayoutPerfil from './LayoutPerfil'
import { MENUS, type Perfil } from './perfis'

function renderizar(perfil: Perfil, rota: string, nomeUsuario?: string) {
  return render(
    <MemoryRouter initialEntries={[rota]}>
      <Routes>
        <Route element={<LayoutPerfil perfil={perfil} nomeUsuario={nomeUsuario} />}>
          <Route path="*" element={<p>conteúdo da tela</p>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  )
}

function itensDoMenu() {
  const menu = screen.getByRole('navigation', { name: 'Menu principal' })
  return within(menu).getAllByRole('link').map((link) => link.textContent)
}

describe('LayoutPerfil (T0-FE)', () => {
  it('mostra só os itens do perfil logado, na ordem de cada perfil', () => {
    const esperado: Record<Perfil, string[]> = {
      BENEFICIARIO: ['Início', 'Minhas pré-guias', 'Minhas informações'],
      MEDICO: ['Início', 'Nova pré-guia', 'Corrigir pré-guias', 'Guias para assinar', 'Minhas informações'],
      CHEFE_FUSEX: ['Guias para assinar', 'Beneficiários', 'Médicos', 'Minhas informações'],
      SETOR_GUIAS: ['Fila de pré-guias'],
      RECEPCAO: ['Guias para impressão'],
    }
    for (const perfil of Object.keys(esperado) as Perfil[]) {
      const { unmount } = renderizar(perfil, MENUS[perfil][0].to)
      expect(itensDoMenu()).toEqual(esperado[perfil])
      unmount()
    }
  })

  it('o menu do médico tem "Corrigir pré-guias" entre "Nova pré-guia" e "Guias para assinar"', () => {
    renderizar('MEDICO', '/medico/inicio')
    const itens = itensDoMenu()
    expect(itens.indexOf('Corrigir pré-guias')).toBe(itens.indexOf('Nova pré-guia') + 1)
    expect(itens.indexOf('Guias para assinar')).toBe(itens.indexOf('Corrigir pré-guias') + 1)
  })

  it('beneficiário e médico mostram "{nome} · {perfil}" na barra superior', () => {
    const { unmount } = renderizar('BENEFICIARIO', '/pre-guias', 'Antonio Carlos Ferreira')
    expect(screen.getByText('Antonio Carlos Ferreira · Beneficiário')).toBeInTheDocument()
    unmount()

    renderizar('MEDICO', '/medico/inicio', 'Cap Méd Ribeiro')
    expect(screen.getByText('Cap Méd Ribeiro · Médico FUSEX')).toBeInTheDocument()
  })

  it('chefe, setor de Guias e recepção mostram só o nome do perfil', () => {
    for (const [perfil, rotulo] of [
      ['CHEFE_FUSEX', 'Chefe do FUSEX'],
      ['SETOR_GUIAS', 'Setor de Guias'],
      ['RECEPCAO', 'Recepção'],
    ] as [Perfil, string][]) {
      const { unmount } = renderizar(perfil, MENUS[perfil][0].to, 'Nome que não aparece')
      expect(screen.getByText(rotulo)).toBeInTheDocument()
      expect(screen.queryByText(/Nome que não aparece/)).not.toBeInTheDocument()
      unmount()
    }
  })

  it('destaca o item ativo pela rota, inclusive em subrotas', () => {
    renderizar('MEDICO', '/medico/corrigir-pre-guias/12')
    expect(screen.getByRole('link', { name: 'Corrigir pré-guias' })).toHaveClass('ativo')
    expect(screen.getByRole('link', { name: 'Nova pré-guia' })).not.toHaveClass('ativo')
  })

  it('o menu do beneficiário não tem "Nova pré-guia" e "Minhas pré-guias" não fica ativo em /pre-guias/nova', () => {
    renderizar('BENEFICIARIO', '/pre-guias/nova')
    expect(screen.queryByRole('link', { name: 'Nova pré-guia' })).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Minhas pré-guias' })).not.toHaveClass('ativo')
  })

  it('aceita o item ativo por props', () => {
    render(
      <MemoryRouter initialEntries={['/qualquer']}>
        <LayoutPerfil perfil="CHEFE_FUSEX" itemAtivo="/chefe/medicos">
          <p>conteúdo</p>
        </LayoutPerfil>
      </MemoryRouter>,
    )
    expect(screen.getByRole('link', { name: 'Médicos' })).toHaveClass('ativo')
    expect(screen.getByRole('link', { name: 'Beneficiários' })).not.toHaveClass('ativo')
  })

  it('renderiza o conteúdo da tela na área principal', () => {
    renderizar('SETOR_GUIAS', '/setor-guias/fila')
    expect(screen.getByRole('main')).toHaveTextContent('conteúdo da tela')
  })

  it('no mobile o menu vira gaveta: o botão abre e fecha', async () => {
    const user = userEvent.setup()
    const { container } = renderizar('RECEPCAO', '/recepcao/guias-para-impressao')
    const botao = screen.getByRole('button', { name: 'Abrir menu' })
    expect(botao).toHaveAttribute('aria-expanded', 'false')

    await user.click(botao)
    expect(screen.getByRole('button', { name: 'Fechar menu' })).toHaveAttribute('aria-expanded', 'true')
    expect(container.querySelector('.app-body')).toHaveClass('menu-aberto')

    // escolher um item fecha a gaveta
    await user.click(screen.getByRole('link', { name: 'Guias para impressão' }))
    expect(container.querySelector('.app-body')).not.toHaveClass('menu-aberto')
  })
})
