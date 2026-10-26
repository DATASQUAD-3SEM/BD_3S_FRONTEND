import { useState, type FormEvent } from 'react'
import { ApiError } from '../../../shared/api/http'

/**
 * Cartao "Alterar senha" (T13-BE1), usado nas telas Minhas informacoes do beneficiario e do medico.
 * Exige nova senha com no minimo 8 caracteres e confirmacao igual; senha atual incorreta aparece no proprio campo.
 */

const TAMANHO_MINIMO_SENHA = 8

interface Mensagem {
  tipo: 'sucesso' | 'erro'
  texto: string
}

interface AlterarSenhaProps {
  onAlterar: (senhaAtual: string, novaSenha: string, confirmacao: string) => Promise<void>
}

interface ErrosCampos {
  senhaAtual?: string
  novaSenha?: string
  confirmacao?: string
}

export default function AlterarSenha({ onAlterar }: AlterarSenhaProps) {
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
      novosErros.novaSenha = `A nova senha precisa ter no mínimo ${TAMANHO_MINIMO_SENHA} caracteres.`
    } else if (novaSenha === senhaAtual) {
      novosErros.novaSenha = 'A nova senha precisa ser diferente da senha atual.'
    }

    if (confirmacao !== novaSenha) {
      novosErros.confirmacao = 'As senhas não coincidem.'
    }

    return novosErros
  }

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
            <label htmlFor="medico-senha-atual">Senha atual</label>
            <input
              id="medico-senha-atual"
              type="password"
              autoComplete="current-password"
              value={senhaAtual}
              onChange={(event) => {
                setSenhaAtual(event.currentTarget.value)
                limparErro('senhaAtual')
              }}
              aria-invalid={Boolean(erros.senhaAtual)}
              aria-describedby={erros.senhaAtual ? 'medico-senha-atual-erro' : undefined}
            />
            {erros.senhaAtual && (
              <p id="medico-senha-atual-erro" className="info-campo-erro" role="alert">
                {erros.senhaAtual}
              </p>
            )}
          </div>

          <div className="info-campo senha-nova">
            <label htmlFor="medico-senha-nova">Nova senha</label>
            <input
              id="medico-senha-nova"
              type="password"
              autoComplete="new-password"
              value={novaSenha}
              onChange={(event) => {
                setNovaSenha(event.currentTarget.value)
                limparErro('novaSenha')
              }}
              aria-invalid={Boolean(erros.novaSenha)}
              aria-describedby={erros.novaSenha ? 'medico-senha-nova-erro' : undefined}
            />
            {erros.novaSenha && (
              <p id="medico-senha-nova-erro" className="info-campo-erro" role="alert">
                {erros.novaSenha}
              </p>
            )}
          </div>

          <div className="info-campo senha-confirmacao">
            <label htmlFor="medico-confirmar-senha">Confirmar nova senha</label>
            <input
              id="medico-confirmar-senha"
              type="password"
              autoComplete="new-password"
              value={confirmacao}
              onChange={(event) => {
                setConfirmacao(event.currentTarget.value)
                limparErro('confirmacao')
              }}
              aria-invalid={Boolean(erros.confirmacao)}
              aria-describedby={erros.confirmacao ? 'medico-confirmar-senha-erro' : undefined}
            />
            {erros.confirmacao && (
              <p id="medico-confirmar-senha-erro" className="info-campo-erro" role="alert">
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
