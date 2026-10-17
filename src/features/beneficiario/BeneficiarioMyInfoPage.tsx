import { useState, type FormEvent } from 'react'
import { useBeneficiario } from './BeneficiarioContext.tsx'
import {
  calcularIdade,
  faixaEtaria,
  formatarDataNascimentoComIdade,
} from './calculosBeneficiario'
import { alterarSenha, salvarAssinatura, salvarTelefone } from './beneficiarioApi'
import AssinaturaDigital from './components/AssinaturaDigital'
import { ApiError } from '../../shared/api/http'

const TAMANHO_MINIMO_SENHA = 8

interface Mensagem {
  tipo: 'sucesso' | 'erro'
  texto: string
}

/** Deixa só os números e aplica a máscara: "(12) 98765-4321". */
function formatarTelefone(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)

  if (digitos.length === 0) return ''

  if (digitos.length <= 2) {
    return digitos.length === 2
      ? `(${digitos})`
      : `(${digitos}`
  }

  if (digitos.length <= 7) {
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`
  }

  return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
}

interface ContatoTelefoneProps {
  telefoneSalvo: string | null | undefined
  /** Recebe só os números e devolve o telefone salvo. Se falhar, lança erro. */
  onSalvar: (telefone: string) => Promise<string>
}

function ContatoTelefone({ telefoneSalvo, onSalvar }: ContatoTelefoneProps) {
  // "Último telefone salvo" com máscara. Serve para saber se o campo mudou.
  const [telefoneSalvoFormatado, setTelefoneSalvoFormatado] = useState(
    () => formatarTelefone(telefoneSalvo ?? ''),
  )
  const [telefone, setTelefone] = useState(telefoneSalvoFormatado)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<Mensagem | null>(null)

  const digitos = telefone.replace(/\D/g, '')
  const telefoneValido = digitos.length === 11
  const telefoneAlterado = telefone !== telefoneSalvoFormatado
  const podeSalvar = telefoneValido && telefoneAlterado && !salvando

  async function salvar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (!podeSalvar) return

    setSalvando(true)
    setMensagem(null)

    try {
      const salvo = formatarTelefone(await onSalvar(digitos))
      setTelefoneSalvoFormatado(salvo)
      setTelefone(salvo)
      setMensagem({ tipo: 'sucesso', texto: 'Telefone salvo com sucesso.' })
    } catch (erro: unknown) {
      setMensagem({
        tipo: 'erro',
        texto:
          erro instanceof ApiError
            ? erro.message
            : 'Não foi possível salvar o telefone. Tente novamente.',
      })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="info-card">
      <h2>Contato</h2>

      <form onSubmit={salvar} noValidate>
        <div className="info-contato-linha">
          <div className="info-campo">
            <label htmlFor="telefone">Telefone</label>

            <input
              id="telefone"
              type="tel"
              inputMode="numeric"
              maxLength={15}
              value={telefone}
              onChange={(event) => {
                setTelefone(formatarTelefone(event.currentTarget.value))
                setMensagem(null)
              }}
              placeholder="(00) 00000-0000"
              aria-invalid={!telefoneValido}
              aria-describedby={!telefoneValido ? 'telefone-erro' : undefined}
            />

            {!telefoneValido && (
              <p id="telefone-erro" className="info-campo-erro" role="alert">
                Informe um telefone completo no formato (00) 00000-0000.
              </p>
            )}
          </div>

          <button type="submit" disabled={!podeSalvar}>
            {salvando ? 'Salvando...' : 'Salvar telefone'}
          </button>
        </div>
      </form>

      {mensagem?.tipo === 'sucesso' && (
        <p className="info-mensagem-sucesso" role="status">
          {mensagem.texto}
        </p>
      )}

      {mensagem?.tipo === 'erro' && (
        <p className="info-campo-erro" role="alert">
          {mensagem.texto}
        </p>
      )}
    </section>
  )
}

interface AlterarSenhaProps {
  onAlterar: (senhaAtual: string, novaSenha: string, confirmacao: string) => Promise<void>
}

interface ErrosCampos {
  senhaAtual?: string
  novaSenha?: string
  confirmacao?: string
}

function AlterarSenha({ onAlterar }: AlterarSenhaProps) {
  const [senhaAtual, setSenhaAtual] = useState('')
  const [novaSenha, setNovaSenha] = useState('')
  const [confirmacao, setConfirmacao] = useState('')
  const [erros, setErros] = useState<ErrosCampos>({})
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<Mensagem | null>(null)

  function validar(): ErrosCampos {
    const novosErros: ErrosCampos = {}

    if (!senhaAtual) {
      novosErros.senhaAtual = 'Informe a senha atual.'
    }

    if (novaSenha.length < TAMANHO_MINIMO_SENHA) {
      novosErros.novaSenha =
        `A nova senha precisa ter no mínimo ${TAMANHO_MINIMO_SENHA} caracteres.`
    } else if (novaSenha === senhaAtual) {
      novosErros.novaSenha = 'A nova senha precisa ser diferente da senha atual.'
    }

    if (confirmacao !== novaSenha) {
      novosErros.confirmacao = 'As senhas não coincidem.'
    }

    return novosErros
  }

  /** Ao digitar de novo num campo, o erro dele some. */
  function limparErro(campo: keyof ErrosCampos) {
    setErros((atual) => ({ ...atual, [campo]: undefined }))
    setMensagem(null)
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setMensagem(null)

    const novosErros = validar()
    setErros(novosErros)

    if (Object.keys(novosErros).length > 0) return

    setSalvando(true)

    try {
      await onAlterar(senhaAtual, novaSenha, confirmacao)

      setSenhaAtual('')
      setNovaSenha('')
      setConfirmacao('')
      setErros({})
      setMensagem({ tipo: 'sucesso', texto: 'Senha alterada com sucesso.' })
    } catch (erro: unknown) {
      // 422 que aponta o campo senhaAtual (contrato T13-BE1): erro embaixo do campo.
      const erroSenhaAtual =
        erro instanceof ApiError &&
        erro.status === 422 &&
        erro.detalhes.some((detalhe) => detalhe.startsWith('senhaAtual'))

      if (erroSenhaAtual) {
        setErros({ senhaAtual: 'Senha atual incorreta.' })
      } else {
        // Demais erros (ex.: 429 por muitas tentativas) aparecem como mensagem geral.
        setMensagem({
          tipo: 'erro',
          texto:
            erro instanceof ApiError
              ? erro.message
              : 'Não foi possível alterar a senha. Tente novamente.',
        })
      }
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="info-card">
      <h2>Alterar senha</h2>

      <form onSubmit={enviar} noValidate>
        <div className="info-senha-grid">
          <div className="info-campo senha-atual">
            <label htmlFor="senha-atual">Senha atual</label>
            <input
              id="senha-atual"
              type="password"
              autoComplete="current-password"
              value={senhaAtual}
              onChange={(event) => {
                setSenhaAtual(event.currentTarget.value)
                limparErro('senhaAtual')
              }}
              aria-invalid={Boolean(erros.senhaAtual)}
              aria-describedby={erros.senhaAtual ? 'senha-atual-erro' : undefined}
            />
            {erros.senhaAtual && (
              <p id="senha-atual-erro" className="info-campo-erro" role="alert">
                {erros.senhaAtual}
              </p>
            )}
          </div>

          <div className="info-campo senha-nova">
            <label htmlFor="senha-nova">Nova senha</label>
            <input
              id="senha-nova"
              type="password"
              autoComplete="new-password"
              value={novaSenha}
              onChange={(event) => {
                setNovaSenha(event.currentTarget.value)
                limparErro('novaSenha')
              }}
              aria-invalid={Boolean(erros.novaSenha)}
              aria-describedby={erros.novaSenha ? 'senha-nova-erro' : undefined}
            />
            {erros.novaSenha && (
              <p id="senha-nova-erro" className="info-campo-erro" role="alert">
                {erros.novaSenha}
              </p>
            )}
          </div>

          <div className="info-campo senha-confirmacao">
            <label htmlFor="confirmar-senha">Confirmar nova senha</label>
            <input
              id="confirmar-senha"
              type="password"
              autoComplete="new-password"
              value={confirmacao}
              onChange={(event) => {
                setConfirmacao(event.currentTarget.value)
                limparErro('confirmacao')
              }}
              aria-invalid={Boolean(erros.confirmacao)}
              aria-describedby={erros.confirmacao ? 'confirmar-senha-erro' : undefined}
            />
            {erros.confirmacao && (
              <p id="confirmar-senha-erro" className="info-campo-erro" role="alert">
                {erros.confirmacao}
              </p>
            )}
          </div>
        </div>

        <button type="submit" className="info-botao-senha" disabled={salvando}>
          {salvando ? 'Alterando...' : 'Alterar senha'}
        </button>
      </form>

      {mensagem?.tipo === 'sucesso' && (
        <p className="info-mensagem-sucesso" role="status">
          {mensagem.texto}
        </p>
      )}

      {mensagem?.tipo === 'erro' && (
        <p className="info-campo-erro" role="alert">
          {mensagem.texto}
        </p>
      )}
    </section>
  )
}

/**
 * Tela "Minhas informações".
 * Dados pessoais são somente leitura. Telefone, senha e assinatura são salvos
 * pelas funções de beneficiarioApi.ts.
 */
export default function MinhasInformacoesPage() {
  const {
    beneficiario,
    carregando,
    erro,
    atualizarBeneficiario,
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

      {/* Dados pessoais (somente leitura) */}
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
      <ContatoTelefone
        telefoneSalvo={beneficiario.telefone}
        onSalvar={async (telefone) => {
          const salvo = await salvarTelefone(telefone)
          atualizarBeneficiario({ telefone: salvo })
          return salvo
        }}
      />

      {/* Alteração de senha */}
      <AlterarSenha onAlterar={alterarSenha} />

      {/* Assinatura digital */}
      <AssinaturaDigital
        cadastrada={beneficiario.assinaturaCadastrada === true}
        onSalvar={async (imagem) => {
          await salvarAssinatura(imagem)
          atualizarBeneficiario({ assinaturaCadastrada: true })
        }}
      />
    </div>
  )
}
