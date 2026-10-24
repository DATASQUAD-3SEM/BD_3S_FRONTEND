import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { ChefeProvider } from './ChefeContext'
import './chefeLayout.css'

const links = [
  { to: '/chefe/guias-para-assinar', label: 'Guias para assinar' },
  { to: '/chefe/beneficiarios', label: 'Beneficiários' },
  { to: '/chefe/medicos', label: 'Médicos' },
  { to: '/chefe/minhas-informacoes', label: 'Minhas informações' },
]

function ShellChefe() {
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <div className="app-shell chefe-layout">
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
          <span className="brand-nome">Nexus</span>
        </div>

        <span className="chefe-usuario">Chefe do FUSEX</span>
      </header>

      <div className={`app-body${menuAberto ? ' menu-aberto' : ''}`}>
        <div
          className="app-overlay"
          onClick={() => setMenuAberto(false)}
          aria-hidden="true"
        />
        <aside className="app-sidebar">
          <nav aria-label="Menu do chefe">
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

export default function ChefeLayout() {
  return (
    <ChefeProvider>
      <ShellChefe />
    </ChefeProvider>
  )
}
