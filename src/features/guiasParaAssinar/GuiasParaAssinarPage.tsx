import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { ApiError } from '../../shared/api/http'
import { guiasParaAssinarApi } from './api'
import type { GuiaParaAssinar, GuiasParaAssinarApi, PapelAssinatura } from './types'
import './guiasParaAssinar.css'

export interface GuiasParaAssinarPageProps {
  perfil: PapelAssinatura
  assinaturaCadastrada: boolean | null
  identificacao?: string
  linkMinhasInformacoes: string
  api?: GuiasParaAssinarApi
}

const ORDEM_LINHAS: PapelAssinatura[] = ['MEDICO', 'CHEFE']

const ROTULO_LINHA: Record<PapelAssinatura, string> = {
  MEDICO: 'Assinatura Auditoria Prévia Med/Dent',
  CHEFE: 'Chefe do FuSEx',
}

const NOTA_PERFIL: Record<PapelAssinatura, string> = {
  MEDICO:
    'Qualquer médico do FUSEX pode assinar: a primeira assinatura vale. A Guia só fica Concluída depois das assinaturas do médico e do chefe.',
  CHEFE: 'A Guia só fica Concluída para o beneficiário depois das duas assinaturas.',
}

function textoPendencias(pendencias: PapelAssinatura[]): string {
  const faltaChefe = pendencias.includes('CHEFE')
  const faltaMedico = pendencias.includes('MEDICO')
  if (faltaChefe && faltaMedico) return 'Faltam assinaturas do chefe e de um médico.'
  if (faltaChefe) return 'Falta assinatura do chefe.'
  if (faltaMedico) return 'Falta assinatura de um médico.'
  return ''
}

function legendaLinha(
  papel: PapelAssinatura,
  perfil: PapelAssinatura,
  pendencias: PapelAssinatura[],
  identificacao?: string,
): string {
  const pendente = pendencias.includes(papel)
  if (papel === perfil) {
    if (pendente) return 'Pendente (sua assinatura)'
    return identificacao ? `Assinada por ${identificacao}` : 'Assinada'
  }
  return pendente ? 'Pendente' : 'Assinada'
}

export default function GuiasParaAssinarPage({
                                               perfil,
                                               assinaturaCadastrada,
                                               identificacao,
                                               linkMinhasInformacoes,
                                               api = guiasParaAssinarApi,
                                             }: GuiasParaAssinarPageProps) {
  const [guias, setGuias] = useState<GuiaParaAssinar[]>([])
  const [estado, setEstado] = useState<'carregando' | 'pronto' | 'erro'>('carregando')
  const [versaoLista, setVersaoLista] = useState(0)
  const [selecionadaId, setSelecionadaId] = useState<number | null>(null)
  const [pdf, setPdf] = useState<{ guiaId: number; url: string } | null>(null)
  const [pdfErroGuiaId, setPdfErroGuiaId] = useState<number | null>(null)
  const [assinando, setAssinando] = useState(false)
  const [mensagem, setMensagem] = useState<{ tipo: 'sucesso' | 'erro'; texto: string } | null>(null)

  const selecionada = guias.find((g) => g.guiaId === selecionadaId) ?? null

  // Lista: carrega ao abrir e de novo depois de cada assinatura
  useEffect(() => {
    let ativo = true
    api
      .listar()
      .then((lista) => {
        if (!ativo) return
        setGuias(lista)
        setEstado('pronto')
        setSelecionadaId((atual) =>
          atual !== null && lista.some((g) => g.guiaId === atual) ? atual : (lista[0]?.guiaId ?? null),
        )
      })
      .catch(() => {
        if (ativo) setEstado('erro')
      })
    return () => {
      ativo = false
    }
  }, [api, versaoLista])

  // Prévia: carrega o PDF da Guia selecionada
  useEffect(() => {
    if (selecionadaId === null) return
    let ativo = true
    let urlCriada: string | null = null
    api
      .obterPdf(selecionadaId, 'visualizar')
      .then((blob) => {
        if (!ativo) return
        urlCriada = URL.createObjectURL(blob)
        setPdf({ guiaId: selecionadaId, url: urlCriada })
        setPdfErroGuiaId(null)
      })
      .catch(() => {
        if (ativo) setPdfErroGuiaId(selecionadaId)
      })
    return () => {
      ativo = false
      if (urlCriada) URL.revokeObjectURL(urlCriada)
    }
  }, [api, selecionadaId])

  const urlPdf = selecionada && pdf && pdf.guiaId === selecionada.guiaId ? pdf.url : null
  const falhouPdf = selecionada !== null && pdfErroGuiaId === selecionada.guiaId

  const podeAssinar =
    selecionada !== null &&
    assinaturaCadastrada === true &&
    selecionada.pendencias.includes(perfil) &&
    !assinando

  async function assinar() {
    if (!selecionada) return
    if (!window.confirm(`Confirmar a assinatura da Guia ${selecionada.numero}?`)) return

    setAssinando(true)
    setMensagem(null)
    try {
      const resultado = await api.assinar(selecionada.guiaId)
      setMensagem({
        tipo: 'sucesso',
        texto: resultado.concluida
          ? 'Assinatura registrada. A Guia está concluída.'
          : 'Assinatura registrada.',
      })
      setVersaoLista((v) => v + 1)
    } catch (erro) {
      const texto =
        erro instanceof ApiError && erro.message
          ? erro.message
          : 'Não foi possível assinar a Guia. Tente novamente.'
      setMensagem({ tipo: 'erro', texto })
      // 409: a Guia mudou no servidor; recarrega para refletir o estado atual
      if (erro instanceof ApiError && erro.status === 409) setVersaoLista((v) => v + 1)
    } finally {
      setAssinando(false)
    }
  }

  async function baixar() {
    if (!selecionada) return
    try {
      const blob = await api.obterPdf(selecionada.guiaId, 'baixar')
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `guia-${selecionada.numero}.pdf`
      link.click()
      window.setTimeout(() => URL.revokeObjectURL(url), 60000)
    } catch {
      setMensagem({ tipo: 'erro', texto: 'Não foi possível baixar o PDF da Guia.' })
    }
  }

  return (
    <section className="gpa">
      <h1>Guias para assinar</h1>

      {estado === 'carregando' && (
        <div className="gpa__painel" data-testid="skeleton" aria-busy="true" aria-label="Carregando Guias">
          <div className="gpa__skeleton" />
          <div className="gpa__skeleton" />
        </div>
      )}

      {estado === 'erro' && (
        <div role="alert" className="estado-erro">
          <p>Não foi possível carregar as Guias para assinar.</p>
          <button
            type="button"
            className="botao botao-primario"
            onClick={() => {
              setEstado('carregando')
              setVersaoLista((v) => v + 1)
            }}
          >
            Tentar novamente
          </button>
        </div>
      )}

      {estado === 'pronto' && guias.length === 0 && (
        <p className="estado-vazio">Nenhuma Guia para assinar</p>
      )}

      {estado === 'pronto' && guias.length > 0 && (
        <div className="gpa__painel">
          <ul className="gpa__lista" aria-label="Guias para assinar">
            {guias.map((guia) => (
              <li key={guia.guiaId}>
                <button
                  type="button"
                  className="gpa__item"
                  aria-pressed={guia.guiaId === selecionadaId}
                  onClick={() => setSelecionadaId(guia.guiaId)}
                >
                  <strong>Guia {guia.numero}</strong>
                  <span className="gpa__item-nome">{guia.beneficiarioNome}</span>
                  <span className="gpa__badge">{textoPendencias(guia.pendencias)}</span>
                </button>
              </li>
            ))}
          </ul>

          {selecionada && (
            <article className="gpa__previa" aria-label={`Prévia da Guia ${selecionada.numero}`}>
              {urlPdf && (
                <iframe src={urlPdf} title={`PDF da Guia ${selecionada.numero}`} className="gpa__pdf" />
              )}
              {!urlPdf && !falhouPdf && <p aria-busy="true">Carregando prévia…</p>}
              {falhouPdf && (
                <p role="alert" className="estado-erro">
                  Não foi possível abrir o PDF da Guia.
                </p>
              )}

              <div className="gpa__linhas">
                {ORDEM_LINHAS.map((papel) => (
                  <div key={papel} className="gpa__linha">
                    <span className="gpa__linha-traco" aria-hidden="true" />
                    <span className="gpa__linha-rotulo">{ROTULO_LINHA[papel]}</span>
                    <span className="gpa__linha-status">
                      {legendaLinha(papel, perfil, selecionada.pendencias, identificacao)}
                    </span>
                  </div>
                ))}
              </div>

              {assinaturaCadastrada === false && (
                <p className="gpa__aviso">
                  Cadastre sua assinatura em <Link to={linkMinhasInformacoes}>Minhas informações</Link>
                </p>
              )}

              <div className="gpa__acoes">
                <button
                  type="button"
                  className="botao botao-primario"
                  disabled={!podeAssinar}
                  onClick={() => void assinar()}
                >
                  {assinando ? 'Assinando...' : 'Assinar com minha assinatura'}
                </button>
                <button type="button" className="botao" onClick={() => void baixar()}>
                  Baixar PDF
                </button>
              </div>

              {mensagem && (
                <p
                  role={mensagem.tipo === 'erro' ? 'alert' : 'status'}
                  className={mensagem.tipo === 'erro' ? 'estado-erro' : 'gpa__sucesso'}
                >
                  {mensagem.texto}
                </p>
              )}

              <p className="gpa__nota">{NOTA_PERFIL[perfil]}</p>
            </article>
          )}
        </div>
      )}
    </section>
  )
}
