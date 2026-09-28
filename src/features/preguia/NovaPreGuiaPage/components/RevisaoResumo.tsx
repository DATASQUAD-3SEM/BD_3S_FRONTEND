import { useEffect, useState } from 'react'
import { listarOcs, listarProcedimentosDaOcs } from '../../../ocs/api'
import type { Ocs, ProcedimentoExame } from '../../../../shared/types/domain'
import type { NovaPreGuiaForm } from '../types'

interface Props {
  form: NovaPreGuiaForm
}

export default function RevisaoResumo({ form }: Props) {
  const [ocsCarregada, setOcsCarregada] = useState<Ocs | null>(null)
  const [ocsIdCarregado, setOcsIdCarregado] = useState<number | null>(null)

  const carregando = form.ocsId !== null && form.ocsId !== ocsIdCarregado
  const ocsExibida = form.ocsId === null ? null : ocsCarregada

  useEffect(() => {
    if (form.ocsId === null) return

    let ativo = true

    listarOcs()
      .then((lista) => lista.find((o) => o.id === form.ocsId) ?? null)
      .then((ocsEncontrada) => {
        if (!ativo) return
        setOcsCarregada(ocsEncontrada)
        setOcsIdCarregado(form.ocsId)
      })
      .catch(() => {
        if (!ativo) return
        setOcsCarregada(null)
        setOcsIdCarregado(form.ocsId)
      })

    return () => { ativo = false }
  }, [form.ocsId])

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
        ) : ocsExibida ? (
          <p>{ocsExibida.nome}</p>
        ) : (
          <p>OCS #{form.ocsId}</p>
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
