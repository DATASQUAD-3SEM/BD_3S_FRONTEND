import LayoutPerfil from '../../shared/layout/LayoutPerfil'
import { garantirPerfilSimulado } from '../../shared/layout/perfis'
import { MedicoProvider, useMedico } from './MedicoContext'
import './medicoLayout.css'

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
