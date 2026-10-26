import LayoutPerfil from '../layout/LayoutPerfil'
import { BeneficiarioProvider, useBeneficiario } from '../../features/beneficiario/BeneficiarioContext'

function ShellBeneficiario() {
  const { beneficiario } = useBeneficiario()
  return <LayoutPerfil perfil="BENEFICIARIO" nomeUsuario={beneficiario?.nome} />
}

/** Área do beneficiário (T0-FE): "Antonio Carlos Ferreira · Beneficiário" e o menu do perfil. */
export default function AppLayout() {
  return (
    <BeneficiarioProvider>
      <ShellBeneficiario />
    </BeneficiarioProvider>
  )
}
