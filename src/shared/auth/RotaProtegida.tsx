import type { ReactNode } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { INICIO_PERFIL, type Perfil } from '../layout/perfis'
import { lerSessao } from './sessao'

interface Props {
  /** Perfil dono da area (ex.: MEDICO para as rotas /medico/...). */
  perfil: Perfil
  children: ReactNode
}

/**
 * Libera a area somente para o perfil informado:
 * - sem login, manda para /login e guarda a rota pedida para voltar depois de entrar;
 * - logado com outro perfil, manda para o inicio do proprio perfil (ex.: o beneficiario que digita
 *   /medico/nova-pre-guia volta para a area do beneficiario).
 *
 * Observacao: o backend tambem confere o perfil em cada endpoint (403); esta checagem evita que a
 * tela errada seja exibida.
 */
export default function RotaProtegida({ perfil, children }: Props) {
  const location = useLocation()
  const sessao = lerSessao()

  if (!sessao) {
    return <Navigate to="/login" replace state={{ de: location.pathname }} />
  }

  if (sessao.perfil !== perfil) {
    return <Navigate to={INICIO_PERFIL[sessao.perfil]} replace />
  }

  return <>{children}</>
}
