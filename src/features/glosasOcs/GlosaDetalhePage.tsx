import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { get } from '../../shared/api/http'
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
}

export const glosaDetalheApi: GlosaDetalheApi = {
  detalhar: (id) => get<GlosaDetalhe>(`/ocs/glosas/${id}`),
}

/** Decisão escolhida na tela para cada guia ainda sem decisão. */
export type Escolha = 'OK' | 'CONTESTADA' | null
export interface Rascunho {
  escolha: Escolha;
  motivo: string;
}

export const MOTIVO_MINIMO = 10

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

  const semDecisao = pendentes.filter((g) => rascunhos[g.guiaId]?.escolha == null).length
  const motivoCurto = pendentes.some(
    (g) => rascunhos[g.guiaId]?.escolha === 'CONTESTADA' && rascunhos[g.guiaId].motivo.trim().length < MOTIVO_MINIMO,
  )

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
              <th scope="col">Guia · Paciente</th>
              <th scope="col">Procedimento</th>
              <th scope="col">Qtd.</th>
              <th scope="col">Informado (R$/sessão)</th>
              <th scope="col">Contrato (R$/sessão)</th>
              <th scope="col">Glosa (R$)</th>
              <th scope="col">Observação da rastreabilidade</th>
              {pendentes.length > 0 && <th scope="col">Sua decisão</th>}
            </tr>
          </thead>
          <tbody>
            {detalhe.guiasGlosadas.map((guia) => {
              const decidindo = pendentes.some((p) => p.guiaId === guia.guiaId)
              const r = rascunhos[guia.guiaId]
              return (
                <tr key={guia.itemId}>
                  <td>
                    {guia.guiaNumero} · {guia.paciente}
                  </td>
                  <td>
                    {guia.codigo} · {guia.procedimento}
                  </td>
                  <td>{guia.quantidadeSessoes}</td>
                  <td>{formatarMoeda(guia.valorSessao)}</td>
                  <td>
                    {guia.valorContrato == null ? '—' : formatarMoeda(guia.valorContrato)}
                    {guia.origemContrato && <span className="sf-selo"> {guia.origemContrato === 'MANUAL' ? 'Manual' : 'Tabela'}</span>}
                  </td>
                  <td>{guia.glosa == null || guia.glosa === 0 ? '—' : formatarMoeda(guia.glosa)}</td>
                  <td>{guia.observacao ?? '—'}</td>
                  {pendentes.length > 0 && (
                    <td>
                      {decidindo ? (
                        <div role="group" aria-label={`Decisão da guia ${guia.guiaNumero}`}>
                          <button
                            type="button"
                            className="sf-botao sf-botao--secundario"
                            aria-pressed={r?.escolha === 'OK'}
                            onClick={() => escolher(guia.guiaId, r?.escolha === 'OK' ? null : 'OK')}
                          >
                            Ok
                          </button>
                          <button
                            type="button"
                            className="sf-botao sf-botao--secundario"
                            aria-pressed={r?.escolha === 'CONTESTADA'}
                            onClick={() => escolher(guia.guiaId, r?.escolha === 'CONTESTADA' ? null : 'CONTESTADA')}
                          >
                            Contestar
                          </button>
                          {r?.escolha === 'CONTESTADA' && (
                            <textarea
                              aria-label={`Motivo da contestação da guia ${guia.guiaNumero}`}
                              value={r.motivo}
                              onChange={(e) => motivo(guia.guiaId, e.target.value)}
                              maxLength={500}
                            />
                          )}
                        </div>
                      ) : (
                        <span>{guia.decisaoOcs === 'OK' ? 'Ok' : guia.decisaoOcs === 'CONTESTADA' ? 'Contestada' : '—'}</span>
                      )}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {pendentes.length > 0 && (
        <div className="sf-acoes">
          {semDecisao > 0 && <p className="sf-pequeno">Faltam {semDecisao} guia(s) sem decisão.</p>}
          {semDecisao === 0 && motivoCurto && (
            <p className="sf-pequeno">O motivo da contestação precisa ter pelo menos {MOTIVO_MINIMO} caracteres.</p>
          )}
          <button type="button" className="sf-botao" disabled={semDecisao > 0 || motivoCurto}>
            Confirmar decisão
          </button>
        </div>
      )}

      <ControleFluxoFatura etapas={detalhe.controleFluxo} />
    </section>
  )
}
