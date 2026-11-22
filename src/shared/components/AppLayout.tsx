import { useEffect, useState } from 'react'
import LayoutPerfil from '../layout/LayoutPerfil'
import { lerSessao } from '../auth/sessao'
import { BeneficiarioProvider, useBeneficiario } from '../../features/beneficiario/BeneficiarioContext'
import { minhasInformacoesOutrosApi } from '../../features/beneficiario/MinhasInformacoesOutros'

/** Nome guardado no login; quando o servidor não conhece a pessoa, ele devolve o próprio login, que não serve de nome. */
function nomeDaSessao(): string | undefined {
  const sessao = lerSessao()
  return sessao?.nome && sessao.nome !== sessao.login ? sessao.nome : undefined
}

function ShellBeneficiario() {
  const { beneficiario } = useBeneficiario()
  // Dependente maior não tem cadastro de titular (/beneficiarios/me): usa o nome devolvido no login.
  return <LayoutPerfil perfil="BENEFICIARIO" nomeUsuario={beneficiario?.nome ?? nomeDaSessao()} />
}

/** T30-FE3: "[nome] · Responsável legal", com o nome de GET /responsavel/me. */
function ShellResponsavel() {
  const [nome, setNome] = useState<string | undefined>(nomeDaSessao())

  useEffect(() => {
    let ativo = true
    minhasInformacoesOutrosApi
      .responsavel()
      .then((dados) => {
        if (ativo && dados.nome) setNome(dados.nome)
      })
      .catch(() => {
        // sem o nome, a barra mostra só "Responsável legal"
      })
    return () => {
      ativo = false
    }
  }, [])

  return <LayoutPerfil perfil="RESPONSAVEL_EXTERNO" nomeUsuario={nome} />
}

/**
 * Área do beneficiário (T0-FE): "Antonio Carlos Ferreira · Beneficiário" e o menu do perfil.
 * O responsável legal externo usa as mesmas telas, com "Helena Costa · Responsável legal" (T30-FE3).
 */
export default function AppLayout() {
  if (lerSessao()?.perfil === 'RESPONSAVEL_EXTERNO') {
    return <ShellResponsavel />
  }
  return (
    <BeneficiarioProvider>
      <ShellBeneficiario />
    </BeneficiarioProvider>
  )
}
