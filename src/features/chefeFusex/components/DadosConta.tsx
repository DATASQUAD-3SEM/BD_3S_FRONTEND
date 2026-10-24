import { useState, type FormEvent } from 'react'
import {
  errosDoBackend,
  validarDadosConta,
  type CampoDadosConta,
  type DadosConta as DadosContaValores,
  type ErrosDadosConta,
} from '../validacaoDadosConta'

interface DadosContaProps {
  nomeInicial: string
  patenteInicial: string
  loginInicial: string
  onSalvar: (dados: DadosContaValores) => Promise<void>
}

interface Mensagem {
  tipo: 'sucesso' | 'erro'
  texto: string
}

interface CampoProps {
  id: string
  label: string
  valor: string
  erro?: string
  tipo?: 'text' | 'password'
  autoComplete?: string
  onChange: (valor: string) => void
}

function Campo({ id, label, valor, erro, tipo = 'text', autoComplete, onChange }: CampoProps) {
  return (
    <div className="info-campo">
      <label htmlFor={id}>{label}</label>
      <input
        id={id}
        type={tipo}
        value={valor}
        autoComplete={autoComplete}
        onChange={(event) => onChange(event.currentTarget.value)}
        aria-invalid={Boolean(erro)}
      />
      {erro && (
        <p className="info-campo-erro" role="alert">
          {erro}
        </p>
      )}
    </div>
  )
}

export default function DadosConta({
                                     nomeInicial,
                                     patenteInicial,
                                     loginInicial,
                                     onSalvar,
                                   }: DadosContaProps) {
  const [dados, setDados] = useState<DadosContaValores>({
    nome: nomeInicial,
    patente: patenteInicial,
    login: loginInicial,
    novaSenha: '',
  })
  const [erros, setErros] = useState<ErrosDadosConta>({})
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState<Mensagem | null>(null)

  function alterarCampo(campo: CampoDadosConta, valor: string) {
    setDados((atual) => ({ ...atual, [campo]: valor }))
    setErros((atual) => ({ ...atual, [campo]: undefined }))
    setMensagem(null)
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setMensagem(null)

    const errosLocais = validarDadosConta(dados)
    setErros(errosLocais)

    if (Object.keys(errosLocais).length > 0) return

    setSalvando(true)

    try {
      await onSalvar(dados)

      setDados((atual) => ({ ...atual, novaSenha: '' }))
      setErros({})
      setMensagem({ tipo: 'sucesso', texto: 'Dados atualizados com sucesso.' })
    } catch (erro: unknown) {
      const { campos, geral } = errosDoBackend(erro)
      setErros(campos)

      if (geral) setMensagem({ tipo: 'erro', texto: geral })
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="info-card">
      <h2>Dados da conta</h2>

      <form onSubmit={enviar} noValidate>
        <div className="info-grid">
          <Campo
            id="chefe-nome"
            label="Nome"
            valor={dados.nome}
            erro={erros.nome}
            onChange={(valor) => alterarCampo('nome', valor)}
          />

          <Campo
            id="chefe-patente"
            label="Patente"
            valor={dados.patente}
            erro={erros.patente}
            onChange={(valor) => alterarCampo('patente', valor)}
          />

          <Campo
            id="chefe-login"
            label="Nome de usuário (login)"
            valor={dados.login}
            erro={erros.login}
            autoComplete="username"
            onChange={(valor) => alterarCampo('login', valor)}
          />

          <Campo
            id="chefe-nova-senha"
            label="Nova senha (deixe em branco para manter)"
            valor={dados.novaSenha}
            erro={erros.novaSenha}
            tipo="password"
            autoComplete="new-password"
            onChange={(valor) => alterarCampo('novaSenha', valor)}
          />
        </div>

        <button type="submit" className="info-botao-senha" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar alterações'}
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
