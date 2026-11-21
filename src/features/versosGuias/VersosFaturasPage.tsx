import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import SeloSituacao from '../setorFatura/components/SeloSituacao'
import { formatarMoeda } from '../setorFatura/formatadores'
import type { SituacaoFatura } from '../setorFatura/types'
import '../setorFatura/setorFatura.css'
import { versosApi, type VersoFatura, type VersosApi } from './api'

interface Props {
  api?: VersosApi
}

type Carga = 'carregando' | 'pronto' | 'erro'

const TODAS = ''

/**
 * Versos das Guias (T32-FE1, regra 15): faturas com Guias glosadas cujo verso já pode ser impresso (a OCS respondeu
 * ou o prazo venceu). Filtro de OCS feito na tela. O cartão abre as Guias da fatura (T32-FE2).
 */
export default function VersosFaturasPage({ api = versosApi }: Props) {
  const [faturas, setFaturas] = useState<VersoFatura[]>([])
  const [carga, setCarga] = useState<Carga>('carregando')
  const [ocs, setOcs] = useState(TODAS)

  useEffect(() => {
    let ativo = true
    api
      .listar()
      .then((lista) => {
        if (!ativo) return
        setFaturas(lista)
        setCarga('pronto')
      })
      .catch(() => {
        if (ativo) setCarga('erro')
      })
    return () => {
      ativo = false
    }
  }, [api])

  const ocsDisponiveis = useMemo(() => [...new Set(faturas.map((f) => f.ocs))].sort(), [faturas])
  const visiveis = ocs === TODAS ? faturas : faturas.filter((f) => f.ocs === ocs)

  return (
    <section className="sf">
      <header className="sf-cabecalho">
        <h1>Versos das Guias</h1>
        <p className="sf-subtitulo">
          Faturas com Guias glosadas. Imprima o verso de cada Guia numa folha A4 em branco, no verso da Guia física.
        </p>
      </header>

      {carga === 'pronto' && faturas.length > 0 && (
        <label className="sf-filtro">
          OCS{' '}
          <select value={ocs} onChange={(e) => setOcs(e.target.value)}>
            <option value={TODAS}>Todas as OCS</option>
            {ocsDisponiveis.map((nome) => (
              <option key={nome} value={nome}>
                {nome}
              </option>
            ))}
          </select>
        </label>
      )}

      {carga === 'carregando' && (
        <div className="sf-vazio" role="status">
          Carregando…
        </div>
      )}
      {carga === 'erro' && (
        <div className="sf-vazio sf-vazio--erro" role="alert">
          Não foi possível carregar os versos.
        </div>
      )}
      {carga === 'pronto' && visiveis.length === 0 && (
        <div className="sf-vazio">Nenhuma Guia glosada com verso para imprimir.</div>
      )}

      {carga === 'pronto' && visiveis.length > 0 && (
        <ul className="sf-lista">
          {visiveis.map((fatura) => (
            <li key={fatura.faturaId}>
              <article className="sf-cartao">
                <Link to={`/rastreabilidade/versos/${fatura.faturaId}`} className="sf-cartao-cabecalho">
                  <span className="sf-cartao-titulo">
                    Fatura nº {fatura.numeroFatura ?? '—'} · {fatura.ocs}
                  </span>
                  <SeloSituacao situacao={fatura.situacao as SituacaoFatura} />
                </Link>
                <p className="sf-cartao-resumo">
                  {fatura.guiasGlosadas} Guia(s) glosada(s) · Glosa: {formatarMoeda(fatura.valorGlosa)}
                </p>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
