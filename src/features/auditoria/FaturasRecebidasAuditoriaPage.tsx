import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SeloSituacao from '../setorFatura/components/SeloSituacao'
import { formatarDataCurta, formatarMoeda } from '../setorFatura/formatadores'
import '../setorFatura/setorFatura.css'
import { auditoriaApi } from './api'
import type { AuditoriaApi, FaturaAuditoriaResumo } from './types'

interface Props {
  api?: AuditoriaApi
}

type Carga = 'carregando' | 'pronto' | 'erro'

/**
 * Tela "Faturas Recebidas" da auditoria (T26-FE1): faturas já lisuradas pela rastreabilidade e que aguardam
 * visualização. Filtro de OCS na tela; clicar num cartão abre a visualização (T26-FE2).
 */
export default function FaturasRecebidasAuditoriaPage({ api = auditoriaApi }: Props) {
  const [faturas, setFaturas] = useState<FaturaAuditoriaResumo[]>([])
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
          Faturas já lisuradas pela rastreabilidade (e com a glosa ciente pela OCS, quando houve glosa). Abra uma fatura
          para visualizar e marcar como visualizada.
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
        <div className="sf-vazio">Nenhuma fatura aguardando visualização.</div>
      )}

      {carga === 'pronto' && faturas.length > 0 && visiveis.length === 0 && (
        <div className="sf-vazio">Nenhuma fatura com esse filtro.</div>
      )}

      {carga === 'pronto' && visiveis.length > 0 && (
        <ul className="sf-lista">
          {visiveis.map((fatura) => (
            <li key={fatura.id}>
              <CartaoFaturaAuditoria fatura={fatura} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

function CartaoFaturaAuditoria({ fatura }: { fatura: FaturaAuditoriaResumo }) {
  const recebida = fatura.dataRecebimentoAuditoria
    ? `Recebida em ${formatarDataCurta(fatura.dataRecebimentoAuditoria)}`
    : 'Recebida'
  return (
    <article className="sf-cartao">
      <Link to={`/auditoria/faturas/${fatura.id}`} className="sf-cartao-cabecalho">
        <span className="sf-cartao-titulo">
          Fatura nº {fatura.numeroFatura ?? '—'} · {fatura.ocs}
        </span>
        <SeloSituacao situacao={fatura.situacao} />
      </Link>
      <p className="sf-cartao-resumo">
        {recebida} · Informado: {formatarMoeda(fatura.valorInformado)} · Glosa:{' '}
        {formatarMoeda(fatura.valorGlosa)} · Final: {formatarMoeda(fatura.valorFinal)}
      </p>
    </article>
  )
}
