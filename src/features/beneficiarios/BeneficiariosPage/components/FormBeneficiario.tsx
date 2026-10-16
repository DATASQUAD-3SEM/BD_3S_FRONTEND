import { useState, type FormEvent } from 'react'
import { calcularIdade, faixaEtaria, mascararCpf, mascararPrecCp } from '../../../../shared/utils/formatar'
import { formVazio, paraForm, problemasDoForm, type Beneficiario, type BeneficiarioForm } from '../../types'

interface Props {
  /** null = cadastro novo; preenchido = editando esse beneficiario. */
  editando: Beneficiario | null
  salvando: boolean
  onSubmit: (dados: BeneficiarioForm) => void
  onCancelar: () => void
}

/**
 * Formulario unico: "Novo beneficiario" ou "Editando beneficiario" (com selo "Modo de edicao").
 * O container troca o `key` para recomecar o estado ao mudar de modo.
 * CPF e Prec CP: guardados so com digitos, exibidos com mascara, limitados a 11 digitos.
 */
export default function FormBeneficiario({ editando, salvando, onSubmit, onCancelar }: Props) {
  const modo = editando ? 'edicao' : 'novo'
  const [form, setForm] = useState<BeneficiarioForm>(editando ? paraForm(editando) : formVazio)

  const atualizar = (parcial: Partial<BeneficiarioForm>) => setForm({ ...form, ...parcial })
  const problemas = problemasDoForm(form, modo)
  const podeSalvar = problemas.length === 0

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (podeSalvar) onSubmit(form)
  }

  let faixa = ''
  if (form.dataNascimento) {
    const idade = calcularIdade(form.dataNascimento)
    faixa = `${faixaEtaria(idade)} (${idade} anos)`
  }

  return (
    <section className={editando ? 'painel painel-dados painel-edicao' : 'painel painel-dados'}>
      <div className="painel-cabecalho">
        <h2 className="painel-titulo">{editando ? 'Editando beneficiário' : 'Novo beneficiário'}</h2>
        {editando && <span className="selo-edicao">Modo de edição</span>}
      </div>

      <form onSubmit={enviar}>
        <div className="form-grade">
          <div className="campo">
            <label htmlFor="benef-nome">Nome</label>
            <input id="benef-nome" type="text" value={form.nome} onChange={(e) => atualizar({ nome: e.target.value })} />
          </div>
          <div className="campo">
            <label htmlFor="benef-cpf">{editando ? 'CPF (login)' : 'CPF (será o login)'}</label>
            <input
              id="benef-cpf"
              type="text"
              inputMode="numeric"
              maxLength={14}
              value={mascararCpf(form.cpf)}
              onChange={(e) => atualizar({ cpf: e.target.value.replace(/\D/g, '').slice(0, 11) })}
            />
          </div>
          <div className="campo">
            <label htmlFor="benef-prec">Prec CP</label>
            <input
              id="benef-prec"
              type="text"
              inputMode="numeric"
              maxLength={12}
              value={mascararPrecCp(form.precCp)}
              onChange={(e) => atualizar({ precCp: e.target.value.replace(/\D/g, '').slice(0, 11) })}
            />
          </div>
          <div className="campo">
            <label htmlFor="benef-nasc">Data de nascimento</label>
            <input
              id="benef-nasc"
              type="date"
              value={form.dataNascimento}
              onChange={(e) => atualizar({ dataNascimento: e.target.value })}
            />
          </div>
          <div className="campo">
            <label htmlFor="benef-tel">Telefone</label>
            <input id="benef-tel" type="tel" value={form.telefone} onChange={(e) => atualizar({ telefone: e.target.value })} />
          </div>

          {editando && (
            <div className="campo">
              <span className="rotulo">Faixa etária (calculada)</span>
              <p className="campo-valor">{faixa || '—'}</p>
            </div>
          )}

          <div className="campo">
            <label htmlFor="benef-senha">
              {editando ? 'Nova senha (deixe em branco para manter)' : 'Senha inicial'}
            </label>
            <input
              id="benef-senha"
              type="password"
              autoComplete="new-password"
              value={form.senha}
              onChange={(e) => atualizar({ senha: e.target.value })}
            />
          </div>

          {editando && (
            <div className="campo">
              <label htmlFor="benef-situacao">Situação</label>
              <select
                id="benef-situacao"
                value={form.ativo ? 'ativo' : 'inativo'}
                onChange={(e) => atualizar({ ativo: e.target.value === 'ativo' })}
              >
                <option value="ativo">Ativo</option>
                <option value="inativo">Inativo</option>
              </select>
            </div>
          )}
        </div>

        <div className="acoes">
          <button type="submit" disabled={salvando || !podeSalvar}>
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar beneficiário'}
          </button>
          <button type="button" className="secundario" onClick={onCancelar} disabled={salvando}>
            Cancelar
          </button>
        </div>
      </form>

      {!podeSalvar && (
        <p className="erro" role="status" style={{ marginTop: '0.75rem' }}>
          <strong>{editando ? 'Para salvar' : 'Para cadastrar'}, falta preencher:</strong> {problemas.join(', ')}.
        </p>
      )}

      <p className="nota">
        {editando
          ? 'Cancelar descarta as mudanças e volta para o formulário de novo cadastro.'
          : 'A assinatura digital é cadastrada pelo próprio beneficiário, depois do primeiro acesso.'}
      </p>
    </section>
  )
}
