import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: 'Início' },
  { to: '/pre-guias/nova', label: 'Nova pré-guia' },
  { to: '/diagnostico/conexao', label: 'Conexão' },
]

export default function AppLayout() {
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <div className="app-shell">
      <header className="app-topbar">
        <button
          type="button"
          className="app-menu-toggle"
          aria-label={menuAberto ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={menuAberto}
          onClick={() => setMenuAberto((v) => !v)}
        >
          <span aria-hidden="true">{menuAberto ? '✕' : '☰'}</span>
        </button>

        <div className="brand">
          <img src="/nexus.jpeg" alt="" className="brand-logo" />
          <span className="brand-nome">Nexus</span>
        </div>
      </header>

      <div className={`app-body${menuAberto ? ' menu-aberto' : ''}`}>
        <div
          className="app-overlay"
          onClick={() => setMenuAberto(false)}
          aria-hidden="true"
        />
        <aside className="app-sidebar">
          <nav aria-label="Menu principal">
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                end
                className={({ isActive }) => (isActive ? 'ativo' : '')}
                onClick={() => setMenuAberto(false)}
              >
                {l.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="app-main">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
