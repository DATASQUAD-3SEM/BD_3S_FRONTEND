import { useState } from 'react'
import { Link } from 'react-router-dom'

import { mensagemDeErro } from '../../../shared/api/erros'
import { useBeneficiario } from '../../beneficiario/BeneficiarioContext'
import { criarPreGuia } from '../api'
import { formVazio, type NovaPreGuiaForm } from './types'

import DadosBeneficiario from './components/DadosBeneficiario'
import SelecaoOcs from './components/SelecaoOcs'
import UploadEncaminhamento from './components/UploadEncaminhamento'
import FeedbackUpload from './components/FeedbackUpload'
import RevisaoResumo from './components/RevisaoResumo'

/**
 * Nova pre-guia do beneficiario: escolha da OCS, envio do encaminhamento medico (foto ou PDF) e envio ao
 * setor de Guias. Os dados pessoais vem do BeneficiarioContext e nao sao enviados: o backend usa o usuario logado.
 * Em sucesso, o formulario e limpo e a pre-guia passa a aparecer em Minhas pre-guias como Pendente.
 */
export default function NovaPreGuiaPage() {
  const [form, setForm] = useState<NovaPreGuiaForm>(formVazio)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [enviando, setEnviando] = useState(false)
  // Muda a cada envio com sucesso para recriar o campo de upload vazio
  const [versaoFormulario, setVersaoFormulario] = useState(0)

  const { beneficiario, carregando: carregandoBeneficiario, erro: erroBeneficiario } = useBeneficiario()

  const faltas: string[] = []
  if (carregandoBeneficiario || erroBeneficiario || !beneficiario) faltas.push('dados do beneficiário')
  if (form.ocs === null) faltas.push('OCS')
  if (form.arquivo === null) faltas.push('arquivo de encaminhamento')

  const podeEnviar = faltas.length === 0

  async function enviar() {
    if (enviando) return
    setEnviando(true)
    setMensagem(null)

    try {
      const preGuia = await criarPreGuia(form)
      setForm(formVazio)
      setVersaoFormulario((v) => v + 1)
      setMensagem({
        tipo: 'ok',
        texto: `Pré-guia ${preGuia.numero} enviada ao setor de Guias. Acompanhe o status em Minhas pré-guias.`,
      })
    } catch (e) {
      setMensagem({ tipo: 'erro', texto: mensagemDeErro(e, 'Não foi possível enviar a pré-guia. Tente novamente.') })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <h1>Nova pré-guia</h1>

      {carregandoBeneficiario && <p>Carregando dados do beneficiário...</p>}

      {erroBeneficiario && (
        <p className="erro" role="alert">
          Não foi possível carregar os dados do beneficiário: {erroBeneficiario}
        </p>
      )}

      {beneficiario && <DadosBeneficiario value={beneficiario} />}

      <SelecaoOcs value={form.ocs} onChange={(ocs) => setForm({ ...form, ocs })} />

      <UploadEncaminhamento
        key={versaoFormulario}
        value={form.arquivo}
        onChange={(arquivo) => setForm({ ...form, arquivo })}
      />

      <FeedbackUpload arquivo={form.arquivo} />

      <RevisaoResumo form={form} beneficiario={beneficiario} />

      <button type="button" onClick={() => void enviar()} disabled={enviando || !podeEnviar}>
        {enviando ? 'Enviando...' : 'Enviar pré-guia'}
      </button>

      {!podeEnviar && !mensagem && (
        <p className="erro" role="status">
          <strong>Para enviar, falta preencher:</strong> {faltas.join(', ')}.
        </p>
      )}

      {mensagem && (
        <p className={mensagem.tipo} role={mensagem.tipo === 'erro' ? 'alert' : 'status'}>
          {mensagem.texto}
          {mensagem.tipo === 'ok' && (
            <>
              {' '}
              <Link to="/pre-guias">Ver Minhas pré-guias</Link>
            </>
          )}
        </p>
      )}
    </>
  )
}
