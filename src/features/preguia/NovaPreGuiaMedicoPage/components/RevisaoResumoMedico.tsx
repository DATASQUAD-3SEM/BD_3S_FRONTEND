import { useEffect, useState } from 'react'
import { listarOcs } from '../../../ocs/api'
import type { Ocs } from '../../../../shared/types/domain'
import type { NovaPreGuiaMedicoForm } from '../types'

interface Props {
  form: NovaPreGuiaMedicoForm
}

export default function RevisaoResumoMedico({ form }: Props) {
  const [ocsCarregada, setOcsCarregada] = useState<Ocs | null>(null)
  const [ocsIdCarregado, setOcsIdCarregado] = useState<number | null>(null)

  const carregando = form.ocsId !== null && form.ocsId !== ocsIdCarregado
  const ocsExibida = form.ocsId === null ? null : ocsCarregada

  useEffect(() => {
    if (form.ocsId === null) return

    let ativo = true
    listarOcs()
      .then((lista) => {
        if (!ativo) return
        setOcsCarregada(lista.find((o) => o.id === form.ocsId) ?? null)
        setOcsIdCarregado(form.ocsId)
      })
      .catch(() => {
        if (!ativo) return
        setOcsCarregada(null)
        setOcsIdCarregado(form.ocsId)
      })

    return () => { ativo = false }
  }, [form.ocsId])

  return (
    <div className="painel">
      <h2>Revisão da pré-guia</h2>

      <section>
        <h3>Beneficiário</h3>
        {form.beneficiario ? (
          <p>
            {form.beneficiario.dados.nome} (Prec-CP: {form.beneficiario.dados.precCp})
          </p>
        ) : (
          <p>Nenhum beneficiário selecionado ainda.</p>
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
        <h3>Procedimentos</h3>
        {form.procedimentos.length === 0 ? (
          <p>Nenhum procedimento adicionado ainda.</p>
        ) : (
          <ul>
            {form.procedimentos.map((p) => (
              <li key={p.id}>
                {p.terminologiaProcedimento} (TUSS {p.codigoTuss})
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
