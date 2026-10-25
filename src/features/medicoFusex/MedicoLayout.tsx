import LayoutPerfil from '../../shared/layout/LayoutPerfil'
import { garantirPerfilSimulado } from '../../shared/layout/perfis'
import { MedicoProvider, useMedico } from './MedicoContext'
import './medicoLayout.css'

/**
 * Layout do perfil Medico (T0-FE): garante o login simulado do medico e mostra "patente + nome" na barra superior.
 */

function ShellMedico() {
  const { medico } = useMedico()
  // "Cap Méd Ribeiro · Médico FUSEX": patente + nome, como no protótipo
  const nome = medico ? `${medico.patente} ${medico.nome}`.trim() : undefined
  return <LayoutPerfil perfil="MEDICO" nomeUsuario={nome} />
}

export default function MedicoLayout() {
  garantirPerfilSimulado('MEDICO')
  return (
    <MedicoProvider>
      <ShellMedico />
    </MedicoProvider>
  )
}
