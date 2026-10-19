import { formatarCpf, formatarPrecCp } from '../../../../shared/utils/formatar.ts'
import type { Beneficiario } from '../../typesBeneficiarios.ts'

interface Props {
  beneficiarios: Beneficiario[]
  editandoId: number | null
  onEditar: (beneficiario: Beneficiario) => void
  onAlternarSituacao: (beneficiario: Beneficiario) => void
}

export default function TabelaBeneficiarios({
  beneficiarios,
  editandoId,
  onEditar,
  onAlternarSituacao,
}: Props) {
  if (beneficiarios.length === 0) {
    return <p>Nenhum beneficiário encontrado.</p>
  }

  return (
    <div className="tabela-rolagem">
      <table className="tabela">
        <thead>
          <tr>
            <th>Nome</th>
            <th>CPF (login)</th>
            <th>Prec CP</th>
            <th>Situação</th>
            <th>
              <span className="so-leitor-de-tela">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {beneficiarios.map((b) => (
            <tr key={b.id} data-editando={b.id === editandoId ? 'true' : 'false'}>
              <td>{b.nome}</td>
              <td>{formatarCpf(b.cpf)}</td>
              <td>{formatarPrecCp(b.precCp)}</td>
              <td>
                <span className={b.ativo ? 'badge badge-ativo' : 'badge badge-inativo'}>
                  {b.ativo ? 'Ativo' : 'Inativo'}
                </span>
              </td>
              <td>
                <div className="acoes">
                  <button
                    type="button"
                    className="secundario"
                    aria-label={`Editar ${b.nome}`}
                    onClick={() => onEditar(b)}
                  >
                    Editar
                  </button>
                  <button
                    type="button"
                    className={b.ativo ? 'secundario' : undefined}
                    aria-label={`${b.ativo ? 'Desativar' : 'Reativar'} ${b.nome}`}
                    onClick={() => onAlternarSituacao(b)}
                  >
                    {b.ativo ? 'Desativar' : 'Reativar'}
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
