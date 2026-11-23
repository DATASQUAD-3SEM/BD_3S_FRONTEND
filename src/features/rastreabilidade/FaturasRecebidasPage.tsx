import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SeloSituacao from '../setorFatura/components/SeloSituacao'
import { formatarDataCurta, formatarMoeda } from '../setorFatura/formatadores'
import '../setorFatura/setorFatura.css'
import { rastreabilidadeApi } from './api'
import type { FaturaLisuraResumo, RastreabilidadeApi } from './types'

interface Props {
  api?: RastreabilidadeApi
}

type Carga = 'carregando' | 'pronto' | 'erro'

/**
 * Tela "Faturas Recebidas" da rastreabilidade (T25-FE-1): faturas enviadas pelo setor de Faturas para a lisura e
 * as que aguardam a OCS, numa lista só, com filtro de OCS feito na tela. Clicar num cartão abre a lisura da fatura.
 */
export default function FaturasRecebidasPage({ api = rastreabilidadeApi }: Props) {
  const [faturas, setFaturas] = useState<FaturaLisuraResumo[]>([])
  const [carga, setCarga] = useState<Carga>('carregando')
  const [filtroOcs, setFiltroOcs] = useState('')

  useEffect(() => {
    let ativo = true
    api
      .listarFaturas()
      .then((dados) => {
        if (!ativo) return
        setFaturas(dados)
        setCarga('pronto')
      })
      .catch(() => {
        if (ativo) setCarga('erro')
      })
    return () => {
      ativo = false
    }
  }, [api])

  const ocsDisponiveis = useMemo(
    () => Array.from(new Set(faturas.map((f) => f.ocs))).sort((a, b) => a.localeCompare(b)),
    [faturas],
  )

  const visiveis = useMemo(
    () => faturas.filter((f) => !filtroOcs || f.ocs === filtroOcs),
    [faturas, filtroOcs],
  )

  return (
    <section className="sf">
      <header className="sf-cabecalho">
        <h1>Faturas Recebidas</h1>
        <p className="sf-subtitulo">
          Faturas enviadas pelo setor de Faturas para a lisura. Abra uma fatura para conferir os valores, registrar a
          glosa e, se houver glosa, acompanhar a ciência da OCS.
        </p>
      </header>

      {carga === 'pronto' && faturas.length > 0 && (
        <div className="sf-filtros">
          <label>
            OCS
            <select value={filtroOcs} onChange={(e) => setFiltroOcs(e.target.value)}>
              <option value="">Todas as OCS</option>
              {ocsDisponiveis.map((ocs) => (
                <option key={ocs} value={ocs}>
                  {ocs}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      {carga === 'carregando' && (
        <div className="sf-vazio" role="status">
          Carregando faturas…
        </div>
      )}

      {carga === 'erro' && (
        <div className="sf-vazio sf-vazio--erro" role="alert">
          Não foi possível carregar as faturas.
        </div>
      )}

      {carga === 'pronto' && faturas.length === 0 && (
        <div className="sf-vazio">Nenhuma fatura aguardando lisura.</div>
      )}

      {carga === 'pronto' && faturas.length > 0 && visiveis.length === 0 && (
        <div className="sf-vazio">Nenhuma fatura com esse filtro.</div>
      )}

      {carga === 'pronto' && visiveis.length > 0 && (
        <ul className="sf-lista">
          {visiveis.map((fatura) => (
            <li key={fatura.id}>
              <CartaoFaturaRecebida fatura={fatura} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function CartaoFaturaRecebida({ fatura }: { fatura: FaturaLisuraResumo }) {
  const periodo = `Período ${formatarDataCurta(fatura.dataInicio)} a ${formatarDataCurta(fatura.dataEnvio)}`
  const valor = `Valor informado ${formatarMoeda(fatura.valorInformado)}`
  const linha =
    fatura.situacao === 'EM_LISURA'
      ? `${periodo} · ${valor} · Linhas decididas: ${fatura.linhasDecididas} de ${fatura.totalLinhas}`
      : `${periodo} · ${valor}${
          fatura.dataEnvioOcs ? ` · Glosas enviadas à OCS em ${formatarDataCurta(fatura.dataEnvioOcs)}` : ''
        }${fatura.liberadaParaAuditoria ? ' · Liberada para a auditoria' : ''}`

  return (
    <article className="sf-cartao">
      <Link to={`/rastreabilidade/faturas/${fatura.id}`} className="sf-cartao-cabecalho">
        <span className="sf-cartao-titulo">
          Fatura nº {fatura.numeroFatura ?? '—'} · {fatura.ocs}
        </span>
        <SeloSituacao situacao={fatura.situacao} />
      </Link>
      <p className="sf-cartao-resumo">{linha}</p>
    </article>
  )
}
