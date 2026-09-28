import { useState } from 'react'
import { ApiError } from '../../../shared/api/http'
import { criarPreGuia } from '../api'
import { formVazio, beneficiarioCompleto, type NovaPreGuiaForm } from './types'
import { beneficiarioLogado } from '../sessaoFake'
import DadosBeneficiario from './components/DadosBeneficiario'
import SelecaoOcs from './components/SelecaoOcs'
import UploadEncaminhamento from './components/UploadEncaminhamento'
import FeedbackUpload from './components/FeedbackUpload'
import RevisaoResumo from './components/RevisaoResumo'

/**
 * CONTAINER MAGRO (SCRUM 33): so guarda o estado e junta os componentes.
 * NAO coloque HTML/logica de um componente aqui. Cada pessoa trabalha no PROPRIO arquivo
 * em ./components. Assim ninguem edita o mesmo arquivo ao mesmo tempo.
 */
export default function NovaPreGuiaPage() {
  const [form, setForm] = useState<NovaPreGuiaForm>({
    ...formVazio,
    beneficiario: beneficiarioLogado,
  })
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [enviando, setEnviando] = useState(false)

  const podeEnviar =
    beneficiarioCompleto(form.beneficiario) &&
    form.arquivo != null &&
    form.ocsId != null

  async function enviar() {
    setEnviando(true)
    setMensagem(null)
    try {
      const preGuia = await criarPreGuia(form)
      setMensagem({ tipo: 'ok', texto: `Pre-guia ${preGuia.id} enviada!` })
    } catch (e) {
      const texto = e instanceof ApiError ? e.message : 'Erro inesperado'
      setMensagem({ tipo: 'erro', texto })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <h1>Nova pre-guia</h1>
      <DadosBeneficiario value={form.beneficiario} />
      <SelecaoOcs value={form.ocsId} onChange={(ocsId) => setForm({ ...form, ocsId, procedimentoIds: [] })} />
      <UploadEncaminhamento value={form.arquivo} onChange={(arquivo) => setForm({ ...form, arquivo })} />
      <FeedbackUpload arquivo={form.arquivo} />
      <RevisaoResumo form={form} />

      <button type="button" onClick={() => void enviar()} disabled={enviando || !podeEnviar}>
        {enviando ? 'Enviando...' : 'Enviar pre-guia'}
      </button>
      {mensagem && (
        <p className={mensagem.tipo} role={mensagem.tipo === 'erro' ? 'alert' : 'status'}>
          {mensagem.texto}
        </p>
      )}
    </>
  )
}
