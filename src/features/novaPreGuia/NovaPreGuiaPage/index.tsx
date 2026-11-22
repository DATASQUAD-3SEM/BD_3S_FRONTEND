import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { get } from '../../../shared/api/http'
import { mensagemDeErro } from '../../../shared/api/erros'
import type { Beneficiario } from '../../../shared/types/domain'
import { criarPreGuia, listarPacientes } from '../api'
import { formVazio, type NovaPreGuiaForm, type PacienteOpcao } from './types'

import DadosBeneficiario from './components/DadosBeneficiario'
import PassoPaciente from './components/PassoPaciente'
import SelecaoOcs from './components/SelecaoOcs'
import UploadEncaminhamento from './components/UploadEncaminhamento'
import FeedbackUpload from './components/FeedbackUpload'
import RevisaoResumo from './components/RevisaoResumo'

/**
 * Nova pre-guia do beneficiario, do dependente maior e do responsavel legal: escolha do paciente, da OCS, envio do
 * encaminhamento medico (foto ou PDF) e envio ao setor de Guias. Os dados do paciente vem de GET /pre-guias/pacientes
 * (T30-BE2), e nao de GET /beneficiarios/me, que so existe para o titular (T30-FE1). Eles nao sao enviados: o backend
 * usa o usuario logado e o dependenteId. Em sucesso, o formulario e limpo e a pre-guia aparece em Minhas pre-guias.
 */
export default function NovaPreGuiaPage() {
  const [form, setForm] = useState<NovaPreGuiaForm>(formVazio)
  const [mensagem, setMensagem] = useState<{ tipo: 'ok' | 'erro'; texto: string } | null>(null)
  const [enviando, setEnviando] = useState(false)
  // Muda a cada envio com sucesso para recriar o campo de upload vazio
  const [versaoFormulario, setVersaoFormulario] = useState(0)

  // Pacientes possiveis, com os dados de cada um (T30-FE1 e T30-BE2).
  const [pacientes, setPacientes] = useState<PacienteOpcao[] | null>(null)
  const [erroPacientes, setErroPacientes] = useState(false)
  const [maioresNomes, setMaioresNomes] = useState<string[]>([])
  // T31-FE4: "Criar pré-guia" do dependente abre esta tela com o menor já escolhido (?paciente=<dependenteId>).
  const [parametros] = useSearchParams()
  const pacienteInicial = Number(parametros.get('paciente')) || null

  useEffect(() => {
    let ativo = true
    listarPacientes()
      .then((lista) => {
        if (!ativo) return
        setPacientes(lista)
        if (pacienteInicial !== null && lista.some((p) => p.dependenteId === pacienteInicial)) {
          setForm((atual) => ({ ...atual, dependenteId: pacienteInicial }))
        } else if (lista.some((p) => p.dependenteId === null)) {
          // O titular comeca marcado; o responsavel legal (sem a opcao "Voce") escolhe o menor.
          setForm((atual) => ({ ...atual, dependenteId: null }))
        }
      })
      .catch(() => {
        if (ativo) setErroPacientes(true)
      })
    get<{ nome: string; tipo?: string; podeCriarPreGuia: boolean }[]>('/beneficiario/dependentes')
      .then((dependentes) => {
        // Só os maiores entram no aviso "Dependentes maiores de idade (como ...)"; o menor sob responsável não.
        if (ativo) setMaioresNomes(dependentes.filter((d) => d.tipo === 'MAIOR').map((d) => d.nome))
      })
      .catch(() => {
        if (ativo) setMaioresNomes([])
      })
    return () => {
      ativo = false
    }
  }, [pacienteInicial])

  // Com um so paciente possivel, o passo nao aparece e o paciente e esse.
  const passoPaciente = pacientes !== null && pacientes.length > 1
  const dependenteEscolhido: number | null | undefined =
    pacientes !== null && pacientes.length === 1 ? pacientes[0].dependenteId : form.dependenteId

  const pacienteEscolhido =
    dependenteEscolhido === undefined ? undefined : pacientes?.find((p) => p.dependenteId === dependenteEscolhido)
  const dadosPaciente: Beneficiario | null = pacienteEscolhido
    ? {
        nome: pacienteEscolhido.nome,
        cpf: pacienteEscolhido.cpf ?? '',
        precCp: pacienteEscolhido.precCp ?? '',
        telefone: pacienteEscolhido.telefone ?? null,
        dataNascimento: pacienteEscolhido.dataNascimento ?? null,
      }
    : null

  const faltas: string[] = []
  if (!pacienteEscolhido) faltas.push('paciente')
  if (form.ocs === null) faltas.push('OCS')
  if (form.arquivo === null) faltas.push('arquivo de encaminhamento')

  const podeEnviar = faltas.length === 0

  async function enviar() {
    if (enviando) return
    setEnviando(true)
    setMensagem(null)

    try {
      const preGuia = await criarPreGuia({ ...form, dependenteId: dependenteEscolhido ?? null })
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

      {pacientes === null && !erroPacientes && <p>Carregando dados do paciente...</p>}

      {erroPacientes && (
        <p className="erro" role="alert">
          Não foi possível carregar os dados do paciente. Recarregue a página.
        </p>
      )}

      {passoPaciente && (
        <PassoPaciente
          pacientes={pacientes}
          maioresNomes={maioresNomes}
          value={form.dependenteId}
          onChange={(dependenteId) => setForm({ ...form, dependenteId })}
        />
      )}

      {dadosPaciente && <DadosBeneficiario value={dadosPaciente} />}
      {!dadosPaciente && passoPaciente && <p className="sf-pequeno">Escolha o paciente no passo 1.</p>}

      <SelecaoOcs value={form.ocs} onChange={(ocs) => setForm({ ...form, ocs })} />

      <UploadEncaminhamento
        key={versaoFormulario}
        value={form.arquivo}
        onChange={(arquivo) => setForm({ ...form, arquivo })}
      />

      <FeedbackUpload arquivo={form.arquivo} />

      <RevisaoResumo form={form} beneficiario={dadosPaciente} />

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
