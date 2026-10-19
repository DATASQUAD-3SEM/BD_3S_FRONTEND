import { useState, type FormEvent } from 'react'
import { mascararCpf, mascararPrecCp } from '../../../../shared/utils/formatar.ts'
import { formVazio, paraForm, problemasDoForm, type Medico, type MedicoForm } from '../../typesMedicos.ts'

interface Props {
  /** null = cadastro novo; preenchido = editando esse medico. */
  editando: Medico | null
  salvando: boolean
  onSubmit: (dados: MedicoForm) => void
  onCancelar: () => void
}

/**
 * Formulario unico: "Novo medico" ou "Editando medico" (com selo "Modo de edicao").
 * O container troca o `key` para recomecar o estado ao mudar de modo.
 * CPF e Prec CP: guardados so com digitos, exibidos com mascara, limitados a 11 digitos.
 */
export default function FormMedico({ editando, salvando, onSubmit, onCancelar }: Props) {
  const modo = editando ? 'edicao' : 'novo'
  const [form, setForm] = useState<MedicoForm>(editando ? paraForm(editando) : formVazio)

  const atualizar = (parcial: Partial<MedicoForm>) => setForm({ ...form, ...parcial })
  const problemas = problemasDoForm(form, modo)
  const podeSalvar = problemas.length === 0

  function enviar(e: FormEvent) {
    e.preventDefault()
    if (podeSalvar) onSubmit(form)
  }

  return (
    <section className={editando ? 'painel painel-dados painel-edicao' : 'painel painel-dados'}>
      <div className="painel-cabecalho">
        <h2 className="painel-titulo">{editando ? 'Editando médico' : 'Novo médico'}</h2>
        {editando && <span className="selo-edicao">Modo de edição</span>}
      </div>

      <form onSubmit={enviar}>
        <div className="form-grade">
          <div className="campo">
            <label htmlFor="medico-nome">Nome</label>
            <input id="medico-nome" type="text" value={form.nome} onChange={(e) => atualizar({ nome: e.target.value })} />
          </div>
          <div className="campo">
            <label htmlFor="medico-patente">Patente</label>
            <input
              id="medico-patente"
              type="text"
              value={form.patente}
              onChange={(e) => atualizar({ patente: e.target.value })}
            />
          </div>
          <div className="campo">
            <label htmlFor="medico-cpf">{editando ? 'CPF (login)' : 'CPF (será o login)'}</label>
            <input
              id="medico-cpf"
              type="text"
              inputMode="numeric"
              maxLength={14}
              value={mascararCpf(form.cpf)}
              onChange={(e) => atualizar({ cpf: e.target.value.replace(/\D/g, '').slice(0, 11) })}
            />
          </div>
          <div className="campo">
            <label htmlFor="medico-prec">Prec CP</label>
            <input
              id="medico-prec"
              type="text"
              inputMode="numeric"
              maxLength={12}
              value={mascararPrecCp(form.precCp)}
              onChange={(e) => atualizar({ precCp: e.target.value.replace(/\D/g, '').slice(0, 11) })}
            />
          </div>
          <div className="campo">
            <label htmlFor="medico-crm">CRM</label>
            <input id="medico-crm" type="text" value={form.crm} onChange={(e) => atualizar({ crm: e.target.value })} />
          </div>
          <div className="campo">
            <label htmlFor="medico-senha">
              {editando ? 'Nova senha (deixe em branco para manter)' : 'Senha inicial'}
            </label>
            <input
              id="medico-senha"
              type="password"
              autoComplete="new-password"
              value={form.senha}
              onChange={(e) => atualizar({ senha: e.target.value })}
            />
          </div>

          {editando && (
            <div className="campo">
              <label htmlFor="medico-situacao">Situação</label>
              <select
                id="medico-situacao"
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
            {salvando ? 'Salvando...' : editando ? 'Salvar alterações' : 'Cadastrar médico'}
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
          : 'A assinatura digital é cadastrada pelo próprio médico, depois do primeiro acesso.'}
      </p>
    </section>
  )
}
