import { useMedico } from './MedicoContext'
import { alterarSenha, salvarAssinatura } from './medicoApi'
import { formatarCpf, formatarPrecCp } from '../../shared/utils/formatadores'
import AlterarSenha from './components/AlterarSenha'
import AssinaturaDigital from '../beneficiario/components/AssinaturaDigital'


export default function MedicoMyInfoPage() {
  const { medico, carregando, erro, atualizarMedico } = useMedico()

  if (carregando) {
    return <p>Carregando dados do médico...</p>
  }

  if (erro || !medico) {
    return (
      <p role="alert">
        {erro ?? 'Não foi possível carregar os dados do médico.'}
      </p>
    )
  }

  return (
    <div className="minhas-info-page">
      <h1>Minhas informações</h1>

      {/* Dados profissionais (somente leitura). Não há telefone: o médico não tem telefone no modelo. */}
      <section className="info-card">
        <h2>Dados profissionais</h2>

        <div className="info-grid">
          <div className="info-dado">
            <span>Nome</span>
            <p>{medico.nome}</p>
          </div>

          <div className="info-dado">
            <span>Patente</span>
            <p>{medico.patente}</p>
          </div>

          <div className="info-dado">
            <span>CPF (login)</span>
            <p>{formatarCpf(medico.cpf)}</p>
          </div>

          <div className="info-dado">
            <span>Prec CP</span>
            <p>{formatarPrecCp(medico.precCp)}</p>
          </div>

          <div className="info-dado">
            <span>CRM</span>
            <p>{medico.crm}</p>
          </div>
        </div>

        <p className="info-observacao">
          Para alterar esses dados, procure o Chefe do FUSEX.
        </p>
      </section>

      <AlterarSenha onAlterar={alterarSenha} />

      <AssinaturaDigital
        cadastrada={medico.assinaturaCadastrada}
        onSalvar={async (imagem) => {
          await salvarAssinatura(imagem)
          atualizarMedico({ assinaturaCadastrada: true })
        }}
      />
    </div>
  )
}
