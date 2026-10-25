import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import type { MedicoDetalhe, MedicosApi } from './tipos'
import {
  errosDoBackend,
  validarFormulario,
  type ErrosMedico,
  type ValoresFormulario,
} from './validacaoMedico'
import { mascaraCpf, mascaraPrecCp, somenteDigitos } from '../../shared/utils/formatadores'

const VAZIO: ValoresFormulario = {
  nome: '',
  patente: '',
  cpf: '',
  precCp: '',
  crm: '',
  senha: '',
  novaSenha: '',
  ativo: true,
}

function valoresDe(medico: MedicoDetalhe | null): ValoresFormulario {
  if (!medico) return VAZIO
  return {
    nome: medico.nome,
    patente: medico.patente,
    cpf: mascaraCpf(medico.cpf),
    precCp: mascaraPrecCp(medico.precCp),
    crm: medico.crm,
    senha: '',
    novaSenha: '',
    ativo: medico.ativo,
  }
}

const classeCampo = (erro?: string) => `med-campo${erro ? ' med-campo--invalido' : ''}`

function Campo({
                 id,
                 rotulo,
                 erro,
                 children,
               }: {
  id: string
  rotulo: string
  erro?: string
  children: ReactNode
}) {
  return (
    <div className="med-campo-grupo">
      <label htmlFor={id} className="med-label">
        {rotulo}
      </label>
      {children}
      {erro && <span className="med-erro">{erro}</span>}
    </div>
  )
}

interface Props {
  api: MedicosApi
  edicao: MedicoDetalhe | null
  onCadastrado: () => void
  onSalvoEdicao: () => void
  onCancelarEdicao: () => void
}

export default function FormularioMedico({
                                           api,
                                           edicao,
                                           onCadastrado,
                                           onSalvoEdicao,
                                           onCancelarEdicao,
                                         }: Props) {
  const modoEdicao = edicao !== null
  const iniciais = useMemo(() => valoresDe(edicao), [edicao])
  const [valores, setValores] = useState<ValoresFormulario>(iniciais)
  const [erros, setErros] = useState<ErrosMedico>({})
  const [geral, setGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const alterado = JSON.stringify(valores) !== JSON.stringify(iniciais)

  function alterar(campo: keyof ValoresFormulario, valor: string | boolean) {
    setValores((atual) => ({ ...atual, [campo]: valor }))
    setErros((atual) => ({ ...atual, [campo]: undefined }))
  }

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const novosErros = validarFormulario(valores, modoEdicao ? 'edicao' : 'cadastro')
    setErros(novosErros)
    setGeral(null)
    if (Object.keys(novosErros).length > 0) return

    const nome = valores.nome.trim()
    const patente = valores.patente.trim()
    const cpf = somenteDigitos(valores.cpf)
    const precCp = somenteDigitos(valores.precCp)
    const crm = valores.crm.trim().toUpperCase()

    setEnviando(true)
    try {
      if (edicao) {
        await api.editar(edicao.id, {
          nome,
          patente,
          cpf,
          precCp,
          crm,
          ativo: valores.ativo,
          novaSenha: valores.novaSenha,
        })
        onSalvoEdicao()
      } else {
        await api.cadastrar({ nome, patente, cpf, precCp, crm, senha: valores.senha })
        setValores(VAZIO)
        onCadastrado()
      }
    } catch (erro) {
      const { campos, geral: mensagem } = errosDoBackend(erro)
      setErros(campos)
      setGeral(mensagem)
    } finally {
      setEnviando(false)
    }
  }

  function cancelar() {
    if (!modoEdicao) {
      setValores(VAZIO)
      setErros({})
      setGeral(null)
      return
    }
    if (alterado && !window.confirm('Descartar as alterações feitas neste médico?')) return
    onCancelarEdicao()
  }

  return (
    <section
      className={`med-form-card${modoEdicao ? ' med-form-card--edicao' : ''}`}
      aria-labelledby="med-titulo-formulario"
    >
      <div className="med-form-cabecalho">
        <h2 id="med-titulo-formulario">{modoEdicao ? 'Editando médico' : 'Novo médico'}</h2>
        {modoEdicao && <span className="med-selo">Modo de edição</span>}
      </div>

      <form onSubmit={enviar} noValidate>
        <div className="med-grid">
          <Campo id="med-nome" rotulo="Nome" erro={erros.nome}>
            <input
              id="med-nome"
              className={classeCampo(erros.nome)}
              value={valores.nome}
              onChange={(e) => alterar('nome', e.target.value)}
            />
          </Campo>

          <Campo id="med-patente" rotulo="Patente" erro={erros.patente}>
            <input
              id="med-patente"
              className={classeCampo(erros.patente)}
              value={valores.patente}
              onChange={(e) => alterar('patente', e.target.value)}
            />
          </Campo>

          <Campo id="med-cpf" rotulo="CPF (será o login)" erro={erros.cpf}>
            <input
              id="med-cpf"
              inputMode="numeric"
              className={classeCampo(erros.cpf)}
              placeholder="000.000.000-00"
              value={valores.cpf}
              onChange={(e) => alterar('cpf', mascaraCpf(e.target.value))}
            />
          </Campo>

          <Campo id="med-precCp" rotulo="Prec CP" erro={erros.precCp}>
            <input
              id="med-precCp"
              inputMode="numeric"
              className={classeCampo(erros.precCp)}
              placeholder="000000000-00"
              value={valores.precCp}
              onChange={(e) => alterar('precCp', mascaraPrecCp(e.target.value))}
            />
          </Campo>

          <Campo id="med-crm" rotulo="CRM" erro={erros.crm}>
            <input
              id="med-crm"
              className={classeCampo(erros.crm)}
              placeholder="123456-SP"
              value={valores.crm}
              onChange={(e) => alterar('crm', e.target.value)}
            />
          </Campo>

          {modoEdicao ? (
            <>
              <Campo id="med-situacao" rotulo="Situação">
                <select
                  id="med-situacao"
                  className="med-campo"
                  value={valores.ativo ? 'ativo' : 'inativo'}
                  onChange={(e) => alterar('ativo', e.target.value === 'ativo')}
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </Campo>

              <Campo id="med-novaSenha" rotulo="Nova senha (deixe em branco para manter)" erro={erros.novaSenha}>
                <input
                  id="med-novaSenha"
                  type="password"
                  autoComplete="new-password"
                  className={classeCampo(erros.novaSenha)}
                  value={valores.novaSenha}
                  onChange={(e) => alterar('novaSenha', e.target.value)}
                />
              </Campo>
            </>
          ) : (
            <Campo id="med-senha" rotulo="Senha inicial" erro={erros.senha}>
              <input
                id="med-senha"
                type="password"
                autoComplete="new-password"
                className={classeCampo(erros.senha)}
                value={valores.senha}
                onChange={(e) => alterar('senha', e.target.value)}
              />
            </Campo>
          )}
        </div>

        {geral && (
          <p role="alert" className="med-aviso med-aviso--erro">
            {geral}
          </p>
        )}

        <div className="med-acoes-form">
          <button type="submit" className="med-btn med-btn--primario" disabled={enviando}>
            {enviando ? 'Salvando...' : modoEdicao ? 'Salvar alterações' : 'Cadastrar médico'}
          </button>
          <button type="button" className="med-btn" onClick={cancelar} disabled={enviando}>
            Cancelar
          </button>
        </div>
      </form>

      <p className="med-nota">
        {modoEdicao
          ? 'Cancelar descarta as alterações e volta ao formulário de novo cadastro.'
          : 'Ao clicar em Editar, este formulário mostra todos os dados do médico para alteração.'}
      </p>
    </section>
  )
}
