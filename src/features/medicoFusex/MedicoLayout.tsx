import { useState } from 'react'
import { NavLink, Outlet } from 'react-router-dom'
import { MedicoProvider, useMedico } from './MedicoContext'
import './medicoLayout.css'

const links = [
  { to: '/', label: 'Início' },
  { to: '/pre-guias/nova', label: 'Nova pré-guia' },
  { to: '/medico/guias-para-assinar', label: 'Guias para assinar' },
  { to: '/medico/minhas-informacoes', label: 'Minhas informações' },
]

function ShellMedico() {
  const { medico } = useMedico()
  const [menuAberto, setMenuAberto] = useState(false)

  const usuario = medico ? `${medico.nome} · Médico FUSEX` : 'Médico FUSEX'

  return (
    <div className="app-shell medico-layout">
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

        <span className="medico-usuario">{usuario}</span>
      </header>

      <div className={`app-body${menuAberto ? ' menu-aberto' : ''}`}>
        <div
          className="app-overlay"
          onClick={() => setMenuAberto(false)}
          aria-hidden="true"
        />
        <aside className="app-sidebar">
          <nav aria-label="Menu do médico">
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

export default function MedicoLayout() {
  return (
    <MedicoProvider>
      <ShellMedico />
    </MedicoProvider>
  )
}
