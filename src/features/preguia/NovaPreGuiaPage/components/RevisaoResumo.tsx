import { useEffect, useState } from 'react'
import { listarOcs, listarProcedimentosDaOcs } from '../../../ocs/api'
import type { Ocs, ProcedimentoExame } from '../../../../shared/types/domain'
import type { NovaPreGuiaForm } from '../types'

interface Props {
  form: NovaPreGuiaForm
}

export default function RevisaoResumo({ form }: Props) {
  const [ocs, setOcs] = useState<Ocs | null>(null)
  const [procedimentos, setProcedimentos] = useState<ProcedimentoExame[]>([])
  const [carregando, setCarregando] = useState(false)

  useEffect(() => {
    if (form.ocsId === null) {
      setOcs(null)
      setProcedimentos([])
      return
    }

    let ativo = true
    setCarregando(true)

    Promise.all([
      listarOcs().then((lista) => lista.find((o) => o.id === form.ocsId) ?? null),
      listarProcedimentosDaOcs(form.ocsId),
    ])
      .then(([ocsEncontrada, procs]) => {
        if (!ativo) return
        setOcs(ocsEncontrada)
        setProcedimentos(procs.filter((p) => form.procedimentoIds.includes(p.id)))
      })
      .catch(() => {
        if (!ativo) return
        setOcs(null)
        setProcedimentos([])
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })

    return () => {
      ativo = false
    }
  }, [form.ocsId, form.procedimentoIds])

  const beneficiarioPreenchido =
    form.beneficiario.nome &&
    form.beneficiario.idade &&
    form.beneficiario.precCp &&
    form.beneficiario.cpf &&
    form.beneficiario.telefone

  return (
    <div className="painel">
      <h2>Revisão da pré-guia</h2>

      <section>
        <h3>Beneficiário</h3>
        {beneficiarioPreenchido ? (
          <ul>
            <li>Nome: {form.beneficiario.nome}</li>
            <li>Idade: {form.beneficiario.idade}</li>
            <li>Prec-CP: {form.beneficiario.precCp}</li>
            <li>CPF: {form.beneficiario.cpf}</li>
            <li>Telefone: {form.beneficiario.telefone}</li>
          </ul>
        ) : (
          <p>Os dados do beneficiario ainda nao foram totalmente preenchidos.</p>
        )}
      </section>

      <section>
        <h3>OCS</h3>
        {form.ocsId === null ? (
          <p>Nenhuma OCS selecionada ainda.</p>
        ) : carregando ? (
          <p>Carregando OCS...</p>
        ) : ocs ? (
          <p>{ocs.nome}</p>
        ) : (
          <p>OCS #{form.ocsId}</p>
        )}
      </section>

      <section>
        <h3>Procedimentos</h3>
        {form.procedimentoIds.length === 0 ? (
          <p>Nenhum procedimento selecionado ainda.</p>
        ) : carregando ? (
          <p>Carregando procedimentos...</p>
        ) : procedimentos.length > 0 ? (
          <ul>
            {procedimentos.map((p) => (
              <li key={p.id}>{p.terminologiaProcedimentoEvento}</li>
            ))}
          </ul>
        ) : (
          <ul>
            {form.procedimentoIds.map((id) => (
              <li key={id}>Procedimento #{id}</li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3>Arquivo</h3>
        {form.arquivo ? (
          <p>{form.arquivo.name}</p>
        ) : (
          <p>Nenhum arquivo anexado ainda.</p>
        )}
      </section>
    </div>
  )
}
