import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import VisualizadorPdf from '../espelhoOcs/VisualizadorPdf'
import { formatarMoeda } from '../setorFatura/formatadores'
import '../setorFatura/setorFatura.css'
import { versosApi, type VersoFaturaDetalhe, type VersosApi } from './api'

interface Props {
  api?: VersosApi
}

type Carga = 'carregando' | 'pronto' | 'erro'

/** O que está aberto no visualizador: o verso de uma Guia ou todos os versos da fatura. */
type Impressao = { tipo: 'guia'; guiaId: number; numero: string } | { tipo: 'todas' }

/**
 * Guias da fatura e impressão dos versos (T32-FE2, regra 15.4): uma linha por Guia glosada com "Imprimir verso",
 * e "Imprimir todos os versos (N)" num PDF com uma página por Guia. Imprimir não grava nada e pode ser repetido.
 */
export default function VersosGuiasFaturaPage({ api = versosApi }: Props) {
  const { id } = useParams()
  const faturaId = Number(id)
  const [detalhe, setDetalhe] = useState<VersoFaturaDetalhe | null>(null)
  const [carga, setCarga] = useState<Carga>('carregando')
  const [impressao, setImpressao] = useState<Impressao | null>(null)

  useEffect(() => {
    let ativo = true
    api
      .detalhar(faturaId)
      .then((d) => {
        if (!ativo) return
        setDetalhe(d)
        setCarga('pronto')
      })
      .catch(() => {
        if (ativo) setCarga('erro')
      })
    return () => {
      ativo = false
    }
  }, [api, faturaId])

  // Função estável por impressão escolhida: o visualizador busca o PDF de novo só quando a escolha muda.
  const obterPdf = useMemo(() => {
    if (!impressao) return undefined
    return impressao.tipo === 'guia'
      ? () => api.pdfDaGuia(faturaId, impressao.guiaId)
      : () => api.pdfDaFatura(faturaId)
  }, [api, faturaId, impressao])

  if (carga === 'carregando') {
    return (
      <section className="sf">
        <div className="sf-vazio" role="status">
          Carregando…
        </div>
      </section>
    )
  }
  if (carga === 'erro' || !detalhe) {
    return (
      <section className="sf">
        <div className="sf-vazio sf-vazio--erro" role="alert">
          Não foi possível carregar as Guias da fatura.
        </div>
      </section>
    )
  }

  return (
    <section className="sf">
      <Link to="/rastreabilidade/versos" className="sf-voltar">
        ← Versos das Guias
      </Link>
      <header className="sf-cabecalho">
        <h1>
          Fatura nº {detalhe.numeroFatura ?? '—'} · {detalhe.ocs}
        </h1>
      </header>

      <p className="sf-faixa sf-faixa--alerta">
        Coloque uma folha A4 em branco na impressora, posicionada para imprimir no verso da Guia indicada no rodapé. A
        folha sai em preto e branco e não tem campo de assinatura.
      </p>

      <div className="sf-tabela-wrapper">
        <table className="sf-tabela">
          <thead>
            <tr>
              <th scope="col">Guia nº</th>
              <th scope="col">Paciente</th>
              <th scope="col">Andamento</th>
              <th scope="col">Glosa (R$)</th>
              <th scope="col">
                <span className="sf-sr-only">Ação</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {detalhe.guias.map((guia) => (
              <tr key={guia.guiaId}>
                <td>{guia.guiaNumero}</td>
                <td>{guia.paciente}</td>
                <td>
                  <span className="sf-selo">{guia.seloFinal}</span>
                </td>
                <td>{formatarMoeda(guia.glosa)}</td>
                <td>
                  <button
                    type="button"
                    className="sf-botao sf-botao--secundario"
                    aria-label={`Imprimir verso da Guia ${guia.guiaNumero}`}
                    onClick={() => setImpressao({ tipo: 'guia', guiaId: guia.guiaId, numero: guia.guiaNumero })}
                  >
                    Imprimir verso
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="sf-acoes">
        <button type="button" className="sf-botao" onClick={() => setImpressao({ tipo: 'todas' })}>
          Imprimir todos os versos ({detalhe.guias.length})
        </button>
      </div>

      {impressao && obterPdf && (
        <VisualizadorPdf
          guiaId={impressao.tipo === 'guia' ? impressao.guiaId : 0}
          numero={impressao.tipo === 'guia' ? impressao.numero : `todas da fatura ${detalhe.numeroFatura ?? ''}`.trim()}
          obterPdf={obterPdf}
          onFechar={() => setImpressao(null)}
        />
      )}
    </section>
  )
}
