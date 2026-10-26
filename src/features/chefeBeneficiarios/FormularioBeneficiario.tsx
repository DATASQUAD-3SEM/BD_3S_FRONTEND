import { useMemo, useState, type FormEvent, type ReactNode } from 'react'
import type { BeneficiarioDetalhe, BeneficiariosApi } from './tipos'
import {
  errosDoBackend,
  resumoFaixa,
  validarFormulario,
  type ErrosBeneficiario,
  type ValoresFormulario,
} from './validacaoBeneficiario'
import { mascaraCpf, mascaraPrecCp, mascaraTelefone, somenteDigitos } from '../../shared/utils/formatadores'

/**
 * Formulario "Novo beneficiario" e "Editando beneficiario" (T7-FE). No modo de edicao, os campos chegam
 * preenchidos e a nova senha e opcional; cancelar com alteracoes pede confirmacao.
 */

const VAZIO: ValoresFormulario = {
  nome: '',
  cpf: '',
  precCp: '',
  dataNascimento: '',
  telefone: '',
  senha: '',
  novaSenha: '',
  ativo: true,
}

function valoresDe(detalhe: BeneficiarioDetalhe | null): ValoresFormulario {
  if (!detalhe) return VAZIO
  return {
    nome: detalhe.nome,
    cpf: mascaraCpf(detalhe.cpf),
    precCp: mascaraPrecCp(detalhe.precCp),
    dataNascimento: detalhe.dataNascimento,
    telefone: mascaraTelefone(detalhe.telefone),
    senha: '',
    novaSenha: '',
    ativo: detalhe.ativo,
  }
}

const classeCampo = (erro?: string) => `benef-campo${erro ? ' benef-campo--invalido' : ''}`

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
    <div className="benef-campo-grupo">
      <label htmlFor={id} className="benef-label">
        {rotulo}
      </label>
      {children}
      {erro && <span className="benef-erro">{erro}</span>}
    </div>
  )
}

interface Props {
  api: BeneficiariosApi
  edicao: BeneficiarioDetalhe | null
  onCadastrado: () => void
  onSalvoEdicao: () => void
  onCancelarEdicao: () => void
}

export default function FormularioBeneficiario({
                                                 api,
                                                 edicao,
                                                 onCadastrado,
                                                 onSalvoEdicao,
                                                 onCancelarEdicao,
                                               }: Props) {
  const modoEdicao = edicao !== null
  const iniciais = useMemo(() => valoresDe(edicao), [edicao])
  const [valores, setValores] = useState<ValoresFormulario>(iniciais)
  const [erros, setErros] = useState<ErrosBeneficiario>({})
  const [geral, setGeral] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  const alterado = JSON.stringify(valores) !== JSON.stringify(iniciais)
  const resumo = modoEdicao ? resumoFaixa(valores.dataNascimento) : null

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
    const cpf = somenteDigitos(valores.cpf)
    const precCp = somenteDigitos(valores.precCp)
    const telefone = somenteDigitos(valores.telefone)

    setEnviando(true)
    try {
      if (edicao) {
        await api.editar(edicao.id, {
          nome,
          cpf,
          precCp,
          dataNascimento: valores.dataNascimento,
          telefone,
          ativo: valores.ativo,
          novaSenha: valores.novaSenha,
        })
        onSalvoEdicao()
      } else {
        await api.cadastrar({
          nome,
          cpf,
          precCp,
          dataNascimento: valores.dataNascimento,
          telefone,
          senha: valores.senha,
        })
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
    if (alterado && !window.confirm('Descartar as alterações feitas neste beneficiário?')) return
    onCancelarEdicao()
  }

  return (
    <section
      className={`benef-form-card${modoEdicao ? ' benef-form-card--edicao' : ''}`}
      aria-labelledby="benef-titulo-formulario"
    >
      <div className="benef-form-cabecalho">
        <h2 id="benef-titulo-formulario">{modoEdicao ? 'Editando beneficiário' : 'Novo beneficiário'}</h2>
        {modoEdicao && <span className="benef-selo">Modo de edição</span>}
      </div>

      <form onSubmit={enviar} noValidate>
        <div className="benef-grid">
          <Campo id="benef-nome" rotulo="Nome" erro={erros.nome}>
            <input
              id="benef-nome"
              className={classeCampo(erros.nome)}
              value={valores.nome}
              onChange={(e) => alterar('nome', e.target.value)}
            />
          </Campo>

          <Campo id="benef-cpf" rotulo="CPF (será o login)" erro={erros.cpf}>
            <input
              id="benef-cpf"
              inputMode="numeric"
              className={classeCampo(erros.cpf)}
              placeholder="000.000.000-00"
              value={valores.cpf}
              onChange={(e) => alterar('cpf', mascaraCpf(e.target.value))}
            />
          </Campo>

          <Campo id="benef-precCp" rotulo="Prec CP" erro={erros.precCp}>
            <input
              id="benef-precCp"
              inputMode="numeric"
              className={classeCampo(erros.precCp)}
              placeholder="000000000-00"
              value={valores.precCp}
              onChange={(e) => alterar('precCp', mascaraPrecCp(e.target.value))}
            />
          </Campo>

          <Campo id="benef-nascimento" rotulo="Data de nascimento" erro={erros.dataNascimento}>
            <input
              id="benef-nascimento"
              type="date"
              className={classeCampo(erros.dataNascimento)}
              value={valores.dataNascimento}
              onChange={(e) => alterar('dataNascimento', e.target.value)}
            />
          </Campo>

          <Campo id="benef-telefone" rotulo="Telefone" erro={erros.telefone}>
            <input
              id="benef-telefone"
              inputMode="tel"
              className={classeCampo(erros.telefone)}
              placeholder="(11) 98765-4321"
              value={valores.telefone}
              onChange={(e) => alterar('telefone', mascaraTelefone(e.target.value))}
            />
          </Campo>

          {modoEdicao ? (
            <>
              <Campo id="benef-faixa" rotulo="Faixa etária">
                <input
                  id="benef-faixa"
                  className="benef-campo"
                  readOnly
                  value={resumo ? `${resumo.rotulo} (${resumo.idade} anos)` : ''}
                />
              </Campo>

              <Campo id="benef-situacao" rotulo="Situação">
                <select
                  id="benef-situacao"
                  className="benef-campo"
                  value={valores.ativo ? 'ativo' : 'inativo'}
                  onChange={(e) => alterar('ativo', e.target.value === 'ativo')}
                >
                  <option value="ativo">Ativo</option>
                  <option value="inativo">Inativo</option>
                </select>
              </Campo>

              <Campo id="benef-novaSenha" rotulo="Nova senha (deixe em branco para manter)" erro={erros.novaSenha}>
                <input
                  id="benef-novaSenha"
                  type="password"
                  autoComplete="new-password"
                  className={classeCampo(erros.novaSenha)}
                  value={valores.novaSenha}
                  onChange={(e) => alterar('novaSenha', e.target.value)}
                />
              </Campo>
            </>
          ) : (
            <Campo id="benef-senha" rotulo="Senha inicial" erro={erros.senha}>
              <input
                id="benef-senha"
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
          <p role="alert" className="benef-aviso benef-aviso--erro">
            {geral}
          </p>
        )}

        <div className="benef-acoes-form">
          <button type="submit" className="benef-btn benef-btn--primario" disabled={enviando}>
            {enviando ? 'Salvando...' : modoEdicao ? 'Salvar alterações' : 'Cadastrar beneficiário'}
          </button>
          <button type="button" className="benef-btn" onClick={cancelar} disabled={enviando}>
            Cancelar
          </button>
        </div>
      </form>

      <p className="benef-nota">
        {modoEdicao
          ? 'Cancelar descarta as alterações e volta ao formulário de novo cadastro.'
          : 'A assinatura digital é cadastrada pelo próprio beneficiário, depois do primeiro acesso.'}
      </p>
    </section>
  )
}
