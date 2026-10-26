import { useChefe } from './ChefeContext'
import { salvarAssinatura, salvarDadosChefe } from './chefeApi'
import DadosConta from './components/DadosConta'
import AssinaturaDigital from '../beneficiario/components/AssinaturaDigital'


/**
 * Tela 12 - Minhas informacoes do Chefe (T12-FE): dados da conta editaveis e assinatura digital.
 */

export default function ChefeMyInfoPage() {
  const { chefe, carregando, erro, atualizarChefe } = useChefe()

  if (carregando) {
    return <p>Carregando dados do chefe...</p>
  }

  if (erro || !chefe) {
    return (
      <p role="alert">
        {erro ?? 'Não foi possível carregar os dados do chefe.'}
      </p>
    )
  }

  return (
    <div className="minhas-info-page">
      <h1>Minhas informações</h1>

      <DadosConta
        nomeInicial={chefe.nome}
        patenteInicial={chefe.patente}
        loginInicial={chefe.login}
        onSalvar={async (dados) => {
          const atualizado = await salvarDadosChefe(dados, chefe.login)
          atualizarChefe(atualizado)
        }}
      />

      <AssinaturaDigital
        cadastrada={chefe.assinaturaCadastrada}
        onSalvar={async (imagem) => {
          await salvarAssinatura(imagem)
          atualizarChefe({ assinaturaCadastrada: true })
        }}
      />
    </div>
  )
}
