import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { get, post } from '../../shared/api/http'
import ControleFluxoFatura from '../setorFatura/components/ControleFluxoFatura'
import { formatarDataCurta, formatarMoeda } from '../setorFatura/formatadores'
import type { EtapaFluxoFatura } from '../setorFatura/types'
import '../setorFatura/setorFatura.css'

/** Guia glosada da fatura (GlosaGuiaResponse, T27-BE1). */
export interface GuiaGlosada {
  itemId: number;
  guiaId: number;
  guiaNumero: string;
  paciente: string;
  codigo: string;
  procedimento: string;
  quantidadeSessoes: number;
  valorSessao: number;
  valorContrato: number | null;
  origemContrato: string | null;
  observacao: string | null;
  decisaoOcs: 'OK' | 'CONTESTADA' | null;
  motivoContestacaoOcs: string | null;
  glosa: number | null;
}

/** Detalhe da glosa (GlosaDetalheResponse, T27-BE1). */
export interface GlosaDetalhe {
  id: number;
  numeroFatura: string | null;
  dataEnvioOcs: string | null;
  prazoOcs: string | null;
  prazoVencido: boolean;
  dataCiencia: string | null;
  responsavelCiencia: string | null;
  valorInformado: number;
  valorGlosa: number | null;
  valorFinal: number | null;
  guiasGlosadas: GuiaGlosada[];
  controleFluxo: EtapaFluxoFatura[];
}

export interface GlosaDetalheApi {
  detalhar(id: number): Promise<GlosaDetalhe>;
  /** Registra a decisão da OCS sobre as guias glosadas (uma só ação). */
  decidir(id: number, corpo: { decisoes: { guiaId: number; decisao: 'OK' | 'CONTESTADA'; motivo: string | null }[]; responsavel: string }): Promise<unknown>;
}

export const glosaDetalheApi: GlosaDetalheApi = {
  detalhar: (id) => get<GlosaDetalhe>(`/ocs/glosas/${id}`),
  decidir: (id, corpo) => post(`/ocs/glosas/${id}/decisao`, corpo),
}

/** Decisão escolhida na tela para cada guia ainda sem decisão. */
export type Escolha = 'OK' | 'CONTESTADA' | null
export interface Rascunho {
  escolha: Escolha;
  motivo: string;
}

export const MOTIVO_MINIMO = 10

const ROTULO_ORIGEM: Record<string, string> = {
  TABELA: 'Tabela',
  TABELA_CORRIGIDA: 'Tabela (corrigida)',
  CONFERIDO: 'Conferido',
  MANUAL: 'Manual',
}

/** Linhas glosadas de uma mesma Guia: a decisão da OCS é uma por Guia (regra 14.3). */
export interface GrupoGuia {
  guiaId: number;
  guiaNumero: string;
  paciente: string;
  linhas: GuiaGlosada[];
}

/** Agrupa as linhas por Guia, na ordem em que a primeira linha de cada Guia aparece. */
export function agruparPorGuia(linhas: GuiaGlosada[]): GrupoGuia[] {
  const grupos = new Map<number, GrupoGuia>()
  for (const linha of linhas) {
    const grupo = grupos.get(linha.guiaId)
    if (grupo) {
      grupo.linhas.push(linha)
    } else {
      grupos.set(linha.guiaId, { guiaId: linha.guiaId, guiaNumero: linha.guiaNumero, paciente: linha.paciente, linhas: [linha] })
    }
  }
  return [...grupos.values()]
}

interface Props {
  api?: GlosaDetalheApi
}

type Carga = 'carregando' | 'pronto' | 'erro'

/**
 * Detalhe da glosa e decisão por Guia (T27-FE2). A decisão é por guia: "Ok" (de acordo com o valor do contrato) ou
 * "Contestar" (com motivo de pelo menos 10 caracteres). Guias já decididas aparecem só como leitura.
 */
export default function GlosaDetalhePage({ api = glosaDetalheApi }: Props) {
  const { id } = useParams()
  const glosaId = Number(id)
  const [detalhe, setDetalhe] = useState<GlosaDetalhe | null>(null)
  const [carga, setCarga] = useState<Carga>('carregando')
  const [rascunhos, setRascunhos] = useState<Record<number, Rascunho>>({})
  const navegar = useNavigate()
  const [painelAberto, setPainelAberto] = useState(false)
  const [responsavel, setResponsavel] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erroDecisao, setErroDecisao] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    api
      .detalhar(glosaId)
      .then((dados) => {
        if (!ativo) return
        setDetalhe(dados)
        setCarga('pronto')
      })
      .catch(() => {
        if (ativo) setCarga('erro')
      })
    return () => {
      ativo = false
    }
  }, [api, glosaId])

  // Guias que ainda pedem decisão nesta rodada (sem decisão registrada e fatura sem ciência).
  const pendentes = useMemo(
    () => (detalhe && !detalhe.dataCiencia ? detalhe.guiasGlosadas.filter((g) => g.decisaoOcs === null) : []),
    [detalhe],
  )

  if (carga === 'carregando') {
    return (
      <section className="sf">
        <div className="sf-vazio" role="status">
          Carregando a glosa…
        </div>
      </section>
    )
  }
  if (carga === 'erro' || !detalhe) {
    return (
      <section className="sf">
        <div className="sf-vazio sf-vazio--erro" role="alert">
          Não foi possível carregar a fatura.
        </div>
      </section>
    )
  }

  // Uma decisão por Guia: as linhas da mesma Guia contam uma vez.
  const guiasPendentes = [...new Set(pendentes.map((g) => g.guiaId))]
  const semDecisao = guiasPendentes.filter((guiaId) => rascunhos[guiaId]?.escolha == null).length
  const motivoCurto = guiasPendentes.some(
    (guiaId) => rascunhos[guiaId]?.escolha === 'CONTESTADA' && rascunhos[guiaId].motivo.trim().length < MOTIVO_MINIMO,
  )

  const algumaContestada = pendentes.some((g) => rascunhos[g.guiaId]?.escolha === 'CONTESTADA')

  async function confirmarDecisao() {
    const nome = responsavel.trim()
    if (nome.length < 3 || nome.length > 100) {
      setErroDecisao('Informe o seu nome (3 a 100 caracteres).')
      return
    }
    setEnviando(true)
    setErroDecisao(null)
    try {
      await api.decidir(glosaId, {
        // Uma decisão por Guia (o backend recusa Guia repetida): as linhas da mesma Guia não se repetem aqui.
        decisoes: guiasPendentes.map((guiaId) => {
          const r = rascunhos[guiaId]
          const contestada = r?.escolha === 'CONTESTADA'
          return { guiaId, decisao: contestada ? 'CONTESTADA' : 'OK', motivo: contestada ? r.motivo.trim() : null }
        }),
        responsavel: nome,
      })
      navegar('/ocs/glosas')
    } catch (e) {
      setErroDecisao(e instanceof Error ? e.message : 'Não foi possível registrar a decisão.')
      setEnviando(false)
    }
  }

  function escolher(guiaId: number, escolha: Escolha) {
    setRascunhos((atuais) => ({ ...atuais, [guiaId]: { motivo: atuais[guiaId]?.motivo ?? '', escolha } }))
  }
  function motivo(guiaId: number, texto: string) {
    setRascunhos((atuais) => ({ ...atuais, [guiaId]: { escolha: atuais[guiaId]?.escolha ?? null, motivo: texto } }))
  }

  return (
    <section className="sf">
      <Link to="/ocs/glosas" className="sf-voltar">
        ← Glosas recebidas
      </Link>

      <header className="sf-cabecalho">
        <h1>Fatura nº {detalhe.numeroFatura ?? '—'}</h1>
        <p className="sf-subtitulo">
          {detalhe.dataEnvioOcs ? `Enviada para decisão em ${formatarDataCurta(detalhe.dataEnvioOcs)}` : ''}
          {detalhe.dataCiencia
            ? ` · Ciência dada em ${formatarDataCurta(detalhe.dataCiencia)}${detalhe.responsavelCiencia ? ` por ${detalhe.responsavelCiencia}` : ''}`
            : detalhe.prazoVencido
              ? ` · Prazo vencido em ${formatarDataCurta(detalhe.prazoOcs)}`
              : ` · Prazo: até ${formatarDataCurta(detalhe.prazoOcs)}`}
        </p>
      </header>

      <p className="sf-faixa sf-faixa--alerta">
        Para cada guia glosada abaixo, escolha 'Ok' (de acordo com o valor do contrato) ou 'Contestar' (se achar que o
        valor do contrato usado na lisura está errado, explicando o motivo). A decisão é por guia; depois de confirmada,
        não pode ser desfeita.
      </p>

      <div className="sf-resumo">
        <div>
          <span>Valor informado pela OCS</span>
          <strong>{formatarMoeda(detalhe.valorInformado)}</strong>
        </div>
        <div>
          <span>Glosa</span>
          <strong>{formatarMoeda(detalhe.valorGlosa)}</strong>
        </div>
        <div>
          <span>Valor final após lisura</span>
          <strong>{formatarMoeda(detalhe.valorFinal)}</strong>
        </div>
      </div>

      <div className="sf-tabela-wrapper">
        <table className="sf-tabela">
          <thead>
            <tr>
              <th scope="col">Procedimento</th>
              <th scope="col">Qtd.</th>
              <th scope="col">Informado (R$/sessão)</th>
              <th scope="col">Contrato (R$/sessão)</th>
              <th scope="col">Glosa (R$)</th>
              <th scope="col">Observação da rastreabilidade</th>
              {pendentes.length > 0 && <th scope="col">Sua decisão</th>}
            </tr>
          </thead>
          {agruparPorGuia(detalhe.guiasGlosadas).map((grupo) => {
            const decidindo = guiasPendentes.includes(grupo.guiaId)
            const r = rascunhos[grupo.guiaId]
            const decisaoRegistrada = grupo.linhas[0].decisaoOcs
            return (
              <tbody key={grupo.guiaId}>
                <tr className="sf-grupo-guia">
                  <th scope="rowgroup" colSpan={6}>
                    Guia nº {grupo.guiaNumero} · {grupo.paciente}
                  </th>
                  {pendentes.length > 0 && (
                    <td>
                      {decidindo ? (
                        <div role="group" aria-label={`Decisão da guia ${grupo.guiaNumero}`}>
                          <button
                            type="button"
                            className="sf-botao sf-botao--secundario"
                            aria-pressed={r?.escolha === 'OK'}
                            onClick={() => escolher(grupo.guiaId, r?.escolha === 'OK' ? null : 'OK')}
                          >
                            Ok
                          </button>
                          <button
                            type="button"
                            className="sf-botao sf-botao--secundario"
                            aria-pressed={r?.escolha === 'CONTESTADA'}
                            onClick={() => escolher(grupo.guiaId, r?.escolha === 'CONTESTADA' ? null : 'CONTESTADA')}
                          >
                            Contestar
                          </button>
                          {r?.escolha === 'CONTESTADA' && (
                            <textarea
                              aria-label={`Motivo da contestação da guia ${grupo.guiaNumero}`}
                              value={r.motivo}
                              onChange={(e) => motivo(grupo.guiaId, e.target.value)}
                              maxLength={500}
                            />
                          )}
                        </div>
                      ) : (
                        <span>
                          {decisaoRegistrada === 'OK' ? 'Ok' : decisaoRegistrada === 'CONTESTADA' ? 'Contestada' : '—'}
                        </span>
                      )}
                    </td>
                  )}
                </tr>
                {grupo.linhas.map((linha) => (
                  <tr key={linha.itemId}>
                    <td>
                      {linha.codigo} · {linha.procedimento}
                    </td>
                    <td>{linha.quantidadeSessoes}</td>
                    <td>{formatarMoeda(linha.valorSessao)}</td>
                    <td>
                      {linha.valorContrato == null ? '—' : formatarMoeda(linha.valorContrato)}
                      {linha.origemContrato && (
                        <span className="sf-selo"> {ROTULO_ORIGEM[linha.origemContrato] ?? linha.origemContrato}</span>
                      )}
                    </td>
                    <td>{linha.glosa == null || linha.glosa === 0 ? '—' : formatarMoeda(linha.glosa)}</td>
                    <td>{linha.observacao ?? '—'}</td>
                    {pendentes.length > 0 && <td />}
                  </tr>
                ))}
              </tbody>
            )
          })}
        </table>
      </div>

      {pendentes.length > 0 && (
        <div className="sf-acoes">
          {semDecisao > 0 && <p className="sf-pequeno">Faltam {semDecisao} guia(s) sem decisão.</p>}
          {semDecisao === 0 && motivoCurto && (
            <p className="sf-pequeno">O motivo da contestação precisa ter pelo menos {MOTIVO_MINIMO} caracteres.</p>
          )}
          <button
            type="button"
            className="sf-botao"
            disabled={semDecisao > 0 || motivoCurto}
            onClick={() => setPainelAberto(true)}
          >
            Confirmar decisão
          </button>
        </div>
      )}

      {painelAberto && (
        <div className="sf-painel" role="dialog" aria-label="Confirmar decisão sobre as glosas">
          <h3>Confirmar decisão sobre as glosas</h3>
          <p>
            {algumaContestada
              ? "Pelo menos uma guia foi contestada: a fatura inteira volta para a rastreabilidade revisar essa(s) guia(s); as demais, marcadas como 'Ok', não mudam."
              : "Todas as guias ficaram com 'Ok': a fatura fica liberada para a auditoria."}{' '}
            Depois de confirmada, a decisão não pode ser desfeita.
          </p>
          <label>
            Responsável (seu nome)
            <input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} maxLength={100} />
          </label>
          {erroDecisao && (
            <p className="sf-erro" role="alert">
              {erroDecisao}
            </p>
          )}
          <div className="sf-acoes">
            <button
              type="button"
              className="sf-botao"
              disabled={enviando || responsavel.trim().length < 3}
              onClick={confirmarDecisao}
            >
              Sim, confirmar decisão
            </button>
            <button
              type="button"
              className="sf-botao sf-botao--secundario"
              onClick={() => setPainelAberto(false)}
              disabled={enviando}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <ControleFluxoFatura etapas={detalhe.controleFluxo} />
    </section>
  )
}
