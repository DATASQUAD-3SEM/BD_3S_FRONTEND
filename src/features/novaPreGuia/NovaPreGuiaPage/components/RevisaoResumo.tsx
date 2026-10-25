import { calcularIdade } from '../../../beneficiario/calculosBeneficiario'
import { formatarCpf, formatarPrecCp, formatarTelefone } from '../../../../shared/utils/formatadores'
import type { Beneficiario } from '../../../../shared/types/domain'
import type { NovaPreGuiaForm } from '../types'

/**
 * Resumo para revisao antes do envio da Nova pre-guia do beneficiario. Somente leitura:
 * mostra os dados do beneficiario logado, a OCS escolhida e o arquivo anexado.
 */

interface Props {
  form: NovaPreGuiaForm
  beneficiario: Beneficiario | null
}

export default function RevisaoResumo({ form, beneficiario }: Props) {
  const idadeBeneficiario = beneficiario ? calcularIdade(beneficiario.dataNascimento) : null

  const beneficiarioPreenchido = Boolean(
    beneficiario?.nome.trim() && beneficiario.cpf.trim() && beneficiario.precCp.trim(),
  )

  return (
    <div className="painel">
      <h2>Revisão da pré-guia</h2>

      <section>
        <h3>Beneficiário</h3>

        {beneficiario && beneficiarioPreenchido ? (
          <ul>
            <li>Nome: {beneficiario.nome}</li>
            <li>Idade: {idadeBeneficiario === null ? '—' : `${idadeBeneficiario} anos`}</li>
            <li>Prec-CP: {formatarPrecCp(beneficiario.precCp)}</li>
            <li>CPF: {formatarCpf(beneficiario.cpf)}</li>
            <li>Telefone: {formatarTelefone(beneficiario.telefone)}</li>
          </ul>
        ) : (
          <p>Os dados do beneficiario ainda nao foram totalmente preenchidos.</p>
        )}
      </section>

      <section>
        <h3>OCS</h3>
        {form.ocs ? (
          <p>
            {form.ocs.nome} · Contrato: {form.ocs.contrato} · {form.ocs.tipo.toUpperCase()}
          </p>
        ) : (
          <p>Nenhuma OCS selecionada ainda.</p>
        )}
      </section>

      <section>
        <h3>Arquivo</h3>
        {form.arquivo ? <p>{form.arquivo.name}</p> : <p>Nenhum arquivo anexado ainda.</p>}
      </section>
    </div>
  )
}
