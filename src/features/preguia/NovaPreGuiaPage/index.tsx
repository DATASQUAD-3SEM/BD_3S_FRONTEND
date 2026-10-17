import { useState } from 'react'

import { ApiError } from '../../../shared/api/http'

import { useBeneficiario } from '../../beneficiario/BeneficiarioContext'

import { criarPreGuia } from '../api'

import {
  formVazio,
  type NovaPreGuiaForm,
} from './types'

import DadosBeneficiario from './components/DadosBeneficiario'
import SelecaoOcs from './components/SelecaoOcs'
import UploadEncaminhamento from './components/UploadEncaminhamento'
import FeedbackUpload from './components/FeedbackUpload'
import RevisaoResumo from './components/RevisaoResumo'

/**
 * A página guarda apenas o estado do formulário.
 * Os dados pessoais vêm do BeneficiarioContext.
 */
export default function NovaPreGuiaPage() {
  const [form, setForm] =
    useState<NovaPreGuiaForm>(formVazio)

  const [mensagem, setMensagem] = useState<{
    tipo: 'ok' | 'erro'
    texto: string
  } | null>(null)

  const [enviando, setEnviando] = useState(false)

  const {
    beneficiario,
    carregando: carregandoBeneficiario,
    erro: erroBeneficiario,
  } = useBeneficiario()

  // Para enviar a pré-guia, precisamos de CPF e Prec-CP.
  const identificacaoCompleta = Boolean(
    beneficiario?.cpf.trim() &&
    beneficiario.precCp.trim(),
  )

  const faltas: string[] = []

  if (
    carregandoBeneficiario ||
    erroBeneficiario ||
    !identificacaoCompleta
  ) {
    faltas.push('dados do beneficiário')
  }

  if (form.ocsId === null) {
    faltas.push('OCS')
  }

  if (form.arquivo === null) {
    faltas.push('arquivo de encaminhamento')
  }

  const podeEnviar = faltas.length === 0

  async function enviar() {
    if (!beneficiario || !identificacaoCompleta) {
      setMensagem({
        tipo: 'erro',
        texto: 'Os dados do beneficiário ainda não foram carregados.',
      })
      return
    }

    setEnviando(true)
    setMensagem(null)

    try {
      const preGuia = await criarPreGuia(
        form,
        beneficiario,
      )

      setMensagem({
        tipo: 'ok',
        texto: `Pré-guia ${preGuia.id} enviada!`,
      })
    } catch (e) {
      const texto =
        e instanceof ApiError
          ? e.message
          : 'Erro inesperado'

      setMensagem({
        tipo: 'erro',
        texto,
      })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <h1>Nova pré-guia</h1>

      {carregandoBeneficiario && (
        <p>Carregando dados do beneficiário...</p>
      )}

      {erroBeneficiario && (
        <p className="erro" role="alert">
          Não foi possível carregar os dados do beneficiário:
          {' '}
          {erroBeneficiario}
        </p>
      )}

      {beneficiario && (
        <DadosBeneficiario value={beneficiario} />
      )}

      <SelecaoOcs
        value={form.ocsId}
        onChange={(ocsId) =>
          setForm({ ...form, ocsId })
        }
      />

      <UploadEncaminhamento
        value={form.arquivo}
        onChange={(arquivo) =>
          setForm({ ...form, arquivo })
        }
      />

      <FeedbackUpload arquivo={form.arquivo} />

      <RevisaoResumo
        form={form}
        beneficiario={beneficiario}
      />

      <button
        type="button"
        onClick={() => void enviar()}
        disabled={enviando || !podeEnviar}
      >
        {enviando ? 'Enviando...' : 'Enviar pré-guia'}
      </button>

      {!podeEnviar && (
        <p className="erro" role="status">
          <strong>Para enviar, falta preencher:</strong>
          {' '}
          {faltas.join(', ')}.
        </p>
      )}

      {mensagem && (
        <p
          className={mensagem.tipo}
          role={mensagem.tipo === 'erro' ? 'alert' : 'status'}
        >
          {mensagem.texto}
        </p>
      )}
    </>
  )
}
