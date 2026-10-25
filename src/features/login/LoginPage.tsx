import { useState, type FormEvent } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

import { ApiError } from '../../shared/api/http'
import { entrar } from '../../shared/auth/loginApi'
import { lerSessao, salvarSessao, type Sessao } from '../../shared/auth/sessao'
import { INICIO_PERFIL, ROTULO_PERFIL } from '../../shared/layout/perfis'
import { CONTAS_DEMONSTRACAO, SENHA_DEMONSTRACAO, acessoRapidoHabilitado } from './contasDemonstracao'
import './login.css'

/**
 * Tela de login (todos os perfis). Campo livre "CPF ou nome de usuario" e senha com o botao Mostrar.
 * Login ou senha errados mostram sempre a mesma mensagem, sem dizer qual dado errou.
 * Depois de entrar, cada perfil vai para a propria area; se o usuario tinha tentado abrir uma rota
 * antes do login, volta para ela (a RotaProtegida ainda confere o perfil).
 */

interface Erro {
  titulo: string
  detalhe: string
}

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const destino = (location.state as { de?: string } | null)?.de

  const [login, setLogin] = useState('')
  const [senha, setSenha] = useState('')
  const [mostrarSenha, setMostrarSenha] = useState(false)
  const [erro, setErro] = useState<Erro | null>(null)
  const [enviando, setEnviando] = useState(false)

  const sessaoAtual = lerSessao()
  if (sessaoAtual) {
    return <Navigate to={INICIO_PERFIL[sessaoAtual.perfil]} replace />
  }

  async function autenticar(loginInformado: string, senhaInformada: string) {
    if (enviando) return
    setEnviando(true)
    setErro(null)
    try {
      const sessao: Sessao = await entrar(loginInformado, senhaInformada)
      salvarSessao(sessao)
      navigate(destino ?? INICIO_PERFIL[sessao.perfil], { replace: true })
    } catch (e) {
      setErro(mensagemDeErro(e))
      setEnviando(false)
    }
  }

  function enviar(evento: FormEvent) {
    evento.preventDefault()
    if (!login.trim() || !senha) {
      setErro({ titulo: 'Preencha o CPF (ou nome de usuário) e a senha.', detalhe: '' })
      return
    }
    void autenticar(login, senha)
  }

  return (
    <div className="login-pagina">
      <header className="login-topbar">
        <span className="login-marca">Nexus</span>
      </header>

      <main className="login-conteudo">
        <form className="login-cartao" onSubmit={enviar} noValidate>
          <h1>Entrar</h1>
          <p className="login-legenda">
            Beneficiário e médico: o seu login é o CPF. Chefe e setores: use o nome de usuário.
          </p>

          <label htmlFor="login-usuario">CPF ou nome de usuário</label>
          <input
            id="login-usuario"
            className="login-input"
            autoComplete="username"
            value={login}
            onChange={(e) => setLogin(e.target.value)}
          />

          <div className="login-linha-senha">
            <label htmlFor="login-senha">Senha</label>
            <button
              type="button"
              className="login-mostrar"
              onClick={() => setMostrarSenha((v) => !v)}
              aria-pressed={mostrarSenha}
            >
              {mostrarSenha ? 'Ocultar' : 'Mostrar'}
            </button>
          </div>
          <input
            id="login-senha"
            className="login-input"
            type={mostrarSenha ? 'text' : 'password'}
            autoComplete="current-password"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          {erro && (
            <div className="login-erro" role="alert">
              <strong>{erro.titulo}</strong>
              {erro.detalhe && <span>{erro.detalhe}</span>}
            </div>
          )}

          <button type="submit" className="login-entrar" disabled={enviando}>
            {enviando ? 'Entrando...' : 'Entrar'}
          </button>

          <p className="login-rodape">Não tem acesso? O cadastro é feito pelo Chefe do FUSEX.</p>
        </form>

        {acessoRapidoHabilitado() && (
          <section className="login-cartao login-rapido" aria-labelledby="titulo-acesso-rapido">
            <h2 id="titulo-acesso-rapido">Acesso rápido (demonstração)</h2>
            <p className="login-legenda">
              Entra com as contas de exemplo do seed (senha {SENHA_DEMONSTRACAO}). Visível só no modo de
              desenvolvimento.
            </p>
            <div className="login-rapido-lista">
              {CONTAS_DEMONSTRACAO.map((conta) => (
                <button
                  key={conta.perfil}
                  type="button"
                  className="login-rapido-botao"
                  disabled={enviando}
                  onClick={() => void autenticar(conta.login, SENHA_DEMONSTRACAO)}
                >
                  <strong>Entrar como {ROTULO_PERFIL[conta.perfil]}</strong>
                  <span>{conta.descricao}</span>
                </button>
              ))}
            </div>
            <Link className="login-diagnostico" to="/diagnostico/conexao">
              Testar conexão com o backend
            </Link>
          </section>
        )}
      </main>
    </div>
  )
}

function mensagemDeErro(e: unknown): Erro {
  if (e instanceof ApiError) {
    if (e.status === 401) {
      return { titulo: 'CPF, usuário ou senha incorretos.', detalhe: 'Confira os dados e tente novamente.' }
    }
    if (e.status === 403) {
      return { titulo: 'Conta desativada.', detalhe: 'Procure o Chefe do FUSEX.' }
    }
    return { titulo: 'Não foi possível entrar.', detalhe: e.message }
  }
  return { titulo: 'Não foi possível entrar.', detalhe: 'Tente novamente em instantes.' }
}
