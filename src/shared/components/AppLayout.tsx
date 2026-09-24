import { NavLink, Outlet } from 'react-router-dom'

const links = [
  { to: '/', label: 'Inicio' },
  { to: '/pre-guias/nova', label: 'Nova pre-guia' },
  { to: '/diagnostico/conexao', label: 'Conexao' },
]

/** Cabecalho + menu + area da pagina. Menu novo? Adicione em "links" acima. */
export default function AppLayout() {
  return (
    <div className="app">
      <header className="app-header">
        <strong className="brand">Nexus · FUSEX</strong>
        <nav aria-label="Menu principal">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} end className={({ isActive }) => (isActive ? 'ativo' : '')}>
              {l.label}
            </NavLink>
          ))}
        </nav>
      </header>
      <main className="app-main">
        <Outlet />
      </main>
    </div>
  )
}
