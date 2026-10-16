import { useBeneficiario } from './BeneficiarioContext.tsx'

import {
  calcularIdade,
  faixaEtaria,
  formatarDataNascimentoComIdade,
} from './calculosBeneficiario'

export default function MinhasInformacoesPage() {
  const {
    beneficiario,
    carregando,
    erro,
  } = useBeneficiario()

  if (carregando) {
    return <p>Carregando beneficiário...</p>
  }

  if (erro || !beneficiario) {
    return (
      <p role="alert">
        Não foi possível carregar os dados do beneficiário.
      </p>
    )
  }

  const idade = calcularIdade(beneficiario.dataNascimento)

  return (
    <div className="minhas-info-page">
      <h1>Minhas informações</h1>

      {/* Dados pessoais */}
      <section className="info-card">
        <h2>Dados pessoais</h2>

        <div className="info-grid">
          <div className="info-dado">
            <span>Nome</span>
            <p>{beneficiario.nome}</p>
          </div>

          <div className="info-dado">
            <span>Grupo</span>
            <p>{beneficiario.grupo ?? '—'}</p>
          </div>

          <div className="info-dado">
            <span>CPF</span>
            <p>{beneficiario.cpf}</p>
          </div>

          <div className="info-dado">
            <span>Prec CP</span>
            <p>{beneficiario.precCp}</p>
          </div>

          <div className="info-dado">
            <span>Data de nascimento</span>
            <p>
              {formatarDataNascimentoComIdade(
                beneficiario.dataNascimento,
              )}
            </p>
          </div>

          <div className="info-dado">
            <span>Faixa etária</span>
            <p>{faixaEtaria(idade) || '—'}</p>
          </div>
        </div>

        <p className="info-observacao">
          Para alterar esses dados, procure o Chefe do FUSEX.
        </p>
      </section>

      {/* Contato */}
      <section className="info-card">
        <h2>Contato</h2>

        <div className="info-contato-linha">
          <div className="info-campo">
            <label htmlFor="telefone">Telefone</label>
            <input
              id="telefone"
              type="tel"
              defaultValue="(12) 98765-4321"
              placeholder="(00) 00000-0000"
            />
          </div>

          <button type="button">
            Salvar telefone
          </button>
        </div>
      </section>

      {/* Alteração de senha */}
      <section className="info-card">
        <h2>Alterar senha</h2>

        <div className="info-senha-grid">
          <div className="info-campo senha-atual">
            <label htmlFor="senha-atual">Senha atual</label>
            <input
              id="senha-atual"
              type="password"
              autoComplete="current-password"
            />
          </div>

          <div className="info-campo senha-nova">
            <label htmlFor="senha-nova">Nova senha</label>
            <input
              id="senha-nova"
              type="password"
              autoComplete="new-password"
            />
          </div>

          <div className="info-campo senha-confirmacao">
            <label htmlFor="confirmar-senha">
              Confirmar nova senha
            </label>
            <input
              id="confirmar-senha"
              type="password"
              autoComplete="new-password"
            />
          </div>
        </div>

        <button type="button" className="info-botao-senha">
          Alterar senha
        </button>
      </section>

      {/* Assinatura digital */}
      <section className="info-card">
        <div className="info-assinatura-cabecalho">
          <h2>Assinatura digital</h2>

          <span className="info-status-pendente">
            Ainda não cadastrada
          </span>
        </div>

        <p className="info-assinatura-descricao">
          Usada para assinar documentos. Desenhe no quadro
          (mouse ou dedo) ou envie uma imagem.
        </p>

        <div
          className="info-quadro-assinatura"
          aria-label="Área ilustrativa da assinatura digital"
        >
          {/* Desenho decorativo nesta primeira versão visual */}
          <svg
            viewBox="0 0 320 100"
            role="img"
            aria-label="Exemplo de assinatura"
          >
            <path
              d="M20 67 C40 18, 67 9, 58 62
                 C50 103, 83 89, 106 48
                 C128 7, 140 22, 151 62
                 C166 111, 196 70, 217 38
                 L280 54"
              fill="none"
              stroke="currentColor"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <div className="info-assinatura-acoes">
          <button type="button" className="info-botao-secundario">
            Limpar
          </button>

          <button type="button" className="info-botao-secundario">
            Enviar imagem
          </button>

          <button type="button">
            Salvar assinatura
          </button>
        </div>
      </section>
    </div>
  )
}
