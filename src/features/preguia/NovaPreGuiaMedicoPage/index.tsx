import { useState } from 'react'
import { ApiError } from '../../../shared/api/http'
import { criarPreGuiaMedico } from '../../medicos/api'
import { medicoLogado } from '../../medicos/sessaoMedicoFake.ts'
import { formMedicoVazio, type NovaPreGuiaMedicoForm } from './types'
import DadosMedico from '../../medicos/components/DadosMedico'
import BuscaBeneficiario from './components/BuscaBeneficiario'
import SelecaoOcs from '../NovaPreGuiaPage/components/SelecaoOcs'
import SelecaoProcedimentos from './components/SelecaoProcedimentos'
import RevisaoResumoMedico from './components/RevisaoResumoMedico'

/**
 * CONTAINER MAGRO (visao do MEDICO do FUSEX): so guarda o estado e junta os componentes.
 * Sem upload de encaminhamento: o medico informa o beneficiario (Prec-CP), a OCS e os exames.
 */
export default function NovaPreGuiaMedicoPage() {
  const [form, setForm] = useState<NovaPreGuiaMedicoForm>(formMedicoVazio)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [enviando, setEnviando] = useState(false)

  const faltas: string[] = []
  if (form.beneficiario == null) faltas.push('beneficiário (Prec-CP)')
  if (form.ocsId == null) faltas.push('OCS')
  if (form.procedimentos.length === 0) faltas.push('ao menos um procedimento')

  const podeEnviar = faltas.length === 0

  async function enviar() {
    if (form.beneficiario == null || form.ocsId == null) return
    setEnviando(true)
    setMensagem(null)
    try {
      const preGuia = await criarPreGuiaMedico({
        beneficiarioId: form.beneficiario.id,
        ocsId: form.ocsId,
        procedimentoIds: form.procedimentos.map((p) => p.id),
      })
      setMensagem({ tipo: 'ok', texto: `Pré-guia ${preGuia.id} enviada!` })
      setForm(formMedicoVazio)
    } catch (e) {
      const texto = e instanceof ApiError ? e.message : 'Erro inesperado'
      setMensagem({ tipo: 'erro', texto })
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <h1>Nova pré-guia</h1>
      <DadosMedico value={medicoLogado} />
      <BuscaBeneficiario
        value={form.beneficiario}
        onChange={(beneficiario) => setForm({ ...form, beneficiario })}
      />
      <SelecaoOcs
        value={form.ocsId}
        onChange={(ocsId) => setForm({ ...form, ocsId })}
      />
      <SelecaoProcedimentos
        value={form.procedimentos}
        onChange={(procedimentos) => setForm({ ...form, procedimentos })}
      />
      <RevisaoResumoMedico form={form} />

      <button type="button" onClick={() => void enviar()} disabled={enviando || !podeEnviar}>
        {enviando ? 'Enviando...' : 'Enviar pré-guia'}
      </button>

      {!podeEnviar && (
        <p className="erro" role="status">
          <strong>Para enviar, falta preencher:</strong> {faltas.join(', ')}.
        </p>
      )}

      {mensagem && (
        <p className={mensagem.tipo} role={mensagem.tipo === 'erro' ? 'alert' : 'status'}>
          {mensagem.texto}
        </p>
      )}
    </>
  )
}
