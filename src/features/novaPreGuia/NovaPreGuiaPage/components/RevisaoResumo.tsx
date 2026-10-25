import { useEffect, useState } from 'react'
import { listarOcs } from '../../ocsApi'
import { calcularIdade } from '../../../beneficiario/calculosBeneficiario'

import type {
  Beneficiario,
  Ocs,
} from '../../../../shared/types/domain'

import type { NovaPreGuiaForm } from '../types'

/**
 * Resumo para revisao antes do envio da Nova pre-guia do beneficiario (Sprint 1).
 */

interface Props {
  form: NovaPreGuiaForm
  beneficiario: Beneficiario | null
}

function formatarCpf(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)

  if (digitos.length !== 11) {
    return valor
  }

  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`
}

function formatarPrecCp(valor: string): string {
  const digitos = valor.replace(/\D/g, '')

  if (digitos.length !== 11) {
    return valor
  }

  return `${digitos.slice(0, 9)}-${digitos.slice(9)}`
}

export default function RevisaoResumo({
                                        form,
                                        beneficiario,
                                      }: Props) {
  const [ocsCarregada, setOcsCarregada] =
    useState<Ocs | null>(null)

  const [ocsIdCarregado, setOcsIdCarregado] =
    useState<number | null>(null)

  const carregando =
    form.ocsId !== null &&
    form.ocsId !== ocsIdCarregado

  const ocsExibida =
    form.ocsId === null ? null : ocsCarregada

  const idadeBeneficiario = beneficiario
    ? calcularIdade(beneficiario.dataNascimento)
    : null

  useEffect(() => {
    if (form.ocsId === null) {
      return
    }

    let ativo = true

    listarOcs()
      .then((lista) => {
        if (!ativo) return

        setOcsCarregada(
          lista.find((o) => o.id === form.ocsId) ?? null,
        )

        setOcsIdCarregado(form.ocsId)
      })
      .catch(() => {
        if (!ativo) return

        setOcsCarregada(null)
        setOcsIdCarregado(form.ocsId)
      })

    return () => {
      ativo = false
    }
  }, [form.ocsId])

  const beneficiarioPreenchido = Boolean(
    beneficiario?.nome.trim() &&
    beneficiario.cpf.trim() &&
    beneficiario.precCp.trim(),
  )

  return (
    <div className="painel">
      <h2>Revisão da pré-guia</h2>

      <section>
        <h3>Beneficiário</h3>

        {beneficiario && beneficiarioPreenchido ? (
          <ul>
            <li>
              Nome: {beneficiario.nome}
            </li>

            <li>
              Idade:{' '}
              {idadeBeneficiario === null
                ? '—'
                : `${idadeBeneficiario} anos`}
            </li>

            <li>
              Prec-CP: {formatarPrecCp(beneficiario.precCp)}
            </li>

            <li>
              CPF: {formatarCpf(beneficiario.cpf)}
            </li>

            <li>
              Telefone: {beneficiario.telefone ?? '—'}
            </li>
          </ul>
        ) : (
          <p>
            Os dados do beneficiario ainda nao foram
            totalmente preenchidos.
          </p>
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
