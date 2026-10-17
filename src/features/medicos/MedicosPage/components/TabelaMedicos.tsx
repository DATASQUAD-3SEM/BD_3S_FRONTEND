import { formatarCpf, formatarPrecCp } from '../../../../shared/utils/formatar'
import type { Medico } from '../types'

interface Props {
  medicos: Medico[]
  editandoId: number | null
  onEditar: (medico: Medico) => void
  onAlternarSituacao: (medico: Medico) => void
}

export default function TabelaMedicos({ medicos, editandoId, onEditar, onAlternarSituacao }: Props) {
  if (medicos.length === 0) {
    return <p>Nenhum médico encontrado.</p>
  }

  return (
    <div className="tabela-rolagem">
      <table className="tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF (login)</th>
            <th>Prec CP</th>
            <th>CRM</th>
            <th>Situação</th>
            <th>
              <span className="so-leitor-de-tela">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {medicos.map((m) => (
            <tr key={m.id} data-editando={m.id === editandoId ? 'true' : 'false'}>
              <td>
                {m.nome}
                <br />
                <small>{m.patente}</small>
              </td>
              <td>{formatarCpf(m.cpf)}</td>
              <td>{formatarPrecCp(m.precCp)}</td>
              <td>{m.crm}</td>
              <td>
                <span className={m.ativo ? 'badge badge-ativo' : 'badge badge-inativo'}>
                  {m.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td>
                <div className="acoes">
                  <button type="button" className="secundario" aria-label={`Editar ${m.nome}`} onClick={() => onEditar(m)}>
                    Editar
                  </button>
                  <button
                    type="button"
                    className={m.ativo ? 'secundario' : undefined}
                    aria-label={`${m.ativo ? 'Desativar' : 'Reativar'} ${m.nome}`}
                    onClick={() => onAlternarSituacao(m)}
                  >
                    {m.ativo ? 'Desativar' : 'Reativar'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
