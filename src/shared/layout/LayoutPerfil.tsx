import { useState, type ReactNode } from 'react'
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom'
import { encerrarSessao } from '../auth/sessao'
import { INICIO_PERFIL, MENUS, ROTULO_PERFIL, type Perfil } from './perfis'

interface Props {
  perfil: Perfil
  /** Nome exibido antes do perfil na barra superior (só beneficiário e médico). */
  nomeUsuario?: string
  /** Item ativo forçado (ex.: em testes). Sem ele, o item ativo vem da rota atual. */
  itemAtivo?: string
  children?: ReactNode
}

/**
 * T0-FE: barra superior verde com "Nexus" e o usuário, e menu lateral só com os itens do perfil.
 * No mobile o menu vira gaveta. As telas entregam só o conteúdo da área principal (Outlet).
 * O botão "Sair" encerra a sessão e volta para a tela de login.
 */
export default function LayoutPerfil({ perfil, nomeUsuario, itemAtivo, children }: Props) {
  const [menuAberto, setMenuAberto] = useState(false)
  const navigate = useNavigate()

  function sair() {
    encerrarSessao()
    navigate('/login', { replace: true })
  }

  // Beneficiário e médico mostram "{nome} · {perfil}"; chefe e setores, só o nome do perfil
  const usaNome = perfil === 'BENEFICIARIO' || perfil === 'MEDICO'
  const usuario = usaNome && nomeUsuario ? `${nomeUsuario} · ${ROTULO_PERFIL[perfil]}` : ROTULO_PERFIL[perfil]

  return (
    <div className="app-shell" data-perfil={perfil}>
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

        <Link className="brand" to={INICIO_PERFIL[perfil]} aria-label="Nexus: página inicial">
          <span className="brand-nome">Nexus</span>
        </Link>

        <div className="app-topbar-direita">
          <span className="app-usuario">{usuario}</span>
          <button type="button" className="app-sair" onClick={sair}>
            Sair
          </button>
        </div>
      </header>

      <div className={`app-body${menuAberto ? ' menu-aberto' : ''}`}>
        <div className="app-overlay" onClick={() => setMenuAberto(false)} aria-hidden="true" />
        <aside className="app-sidebar">
          <nav aria-label="Menu principal">
            {MENUS[perfil].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/pre-guias'}
                className={({ isActive }) =>
                  (itemAtivo ? itemAtivo === item.to : isActive) ? 'ativo' : ''
                }
                aria-current={itemAtivo === item.to ? 'page' : undefined}
                onClick={() => setMenuAberto(false)}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>
        </aside>
        <main className="app-main">{children ?? <Outlet />}</main>
      </div>
    </div>
  )
}
