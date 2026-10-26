import LayoutPerfil from '../../shared/layout/LayoutPerfil'
import { MedicoProvider, useMedico } from './MedicoContext'
import './medicoLayout.css'

/**
 * Layout do perfil Medico (T0-FE): mostra "patente + nome" na barra superior.
 */

function ShellMedico() {
  const { medico } = useMedico()
  // "Cap Méd Ribeiro · Médico FUSEX": patente + nome, como no protótipo
  const nome = medico ? `${medico.patente} ${medico.nome}`.trim() : undefined
  return <LayoutPerfil perfil="MEDICO" nomeUsuario={nome} />
}

export default function MedicoLayout() {
  return (
    <MedicoProvider>
      <ShellMedico />
    </MedicoProvider>
  )
}
