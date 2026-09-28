import { useEffect, useState } from 'react'
import { listarOcs, listarProcedimentosDaOcs } from '../../../ocs/api'
import type { Ocs, ProcedimentoExame } from '../../../../shared/types/domain'
import type { NovaPreGuiaForm } from '../types'

interface Props {
  form: NovaPreGuiaForm
}

export default function RevisaoResumo({ form }: Props) {
  const [ocsCarregada, setOcsCarregada] = useState<Ocs | null>(null)
  const [procedimentosDaOcs, setProcedimentosDaOcs] = useState<ProcedimentoExame[]>([])
  const [ocsIdCarregado, setOcsIdCarregado] = useState<number | null>(null)

  // carregando = "selecionei uma OCS que ainda nao terminou de carregar".
  // Derivado: nao precisa de useState nem de setState sincrono no effect.
  const carregando = form.ocsId !== null && form.ocsId !== ocsIdCarregado

  // Filtra em tempo de render (antes era dentro do .then). Assim o efeito so
  // depende de form.ocsId e nao precisa refazer fetch quando os procedimentos mudam.
  const ocsExibida = form.ocsId === null ? null : ocsCarregada
  const procedimentosExibidos =
    form.ocsId === null
      ? []
      : procedimentosDaOcs.filter((p) => form.procedimentoIds.includes(p.id))

  useEffect(() => {
    if (form.ocsId === null) return   // nada para buscar

    let ativo = true

    Promise.all([
      listarOcs().then((lista) => lista.find((o) => o.id === form.ocsId) ?? null),
      listarProcedimentosDaOcs(form.ocsId),
    ])
      .then(([ocsEncontrada, procs]) => {
        if (!ativo) return
        setOcsCarregada(ocsEncontrada)
        setProcedimentosDaOcs(procs)
        setOcsIdCarregado(form.ocsId)   // marca "terminei de carregar este id"
      })
      .catch(() => {
        if (!ativo) return
        setOcsCarregada(null)
        setProcedimentosDaOcs([])
        setOcsIdCarregado(form.ocsId)   // marca mesmo com erro, para sair do "carregando"
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
        <h3>Procedimentos</h3>
        {form.procedimentoIds.length === 0 ? (
          <p>Nenhum procedimento selecionado ainda.</p>
        ) : carregando ? (
          <p>Carregando procedimentos...</p>
        ) : procedimentosExibidos.length > 0 ? (
          <ul>
            {procedimentosExibidos.map((p) => (
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
