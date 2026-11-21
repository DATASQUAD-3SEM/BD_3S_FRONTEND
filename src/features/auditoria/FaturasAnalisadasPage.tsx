import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import SeloSituacao from '../setorFatura/components/SeloSituacao'
import { formatarDataCurta, formatarMoeda } from '../setorFatura/formatadores'
import '../setorFatura/setorFatura.css'
import { auditoriaApi } from './api'
import type { AuditoriaApi, FaturaAnalisadaResumo } from './types'

interface Props {
  api?: AuditoriaApi
}

type Carga = 'carregando' | 'pronto' | 'erro'

/**
 * Tela "Faturas Analisadas" da auditoria (T26-FE4): histórico das faturas que a auditoria já visualizou, da
 * visualização mais recente para a mais antiga. Só consulta. Clicar abre a visualização só de leitura.
 */
export default function FaturasAnalisadasPage({ api = auditoriaApi }: Props) {
  const [faturas, setFaturas] = useState<FaturaAnalisadaResumo[]>([])
  const [carga, setCarga] = useState<Carga>('carregando')

  useEffect(() => {
    let ativo = true
    api
      .listarAnalisadas()
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

  return (
    <section className="sf">
      <header className="sf-cabecalho">
        <h1>Faturas Analisadas</h1>
        <p className="sf-subtitulo">Faturas que a auditoria já visualizou. Só consulta.</p>
      </header>

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
        <div className="sf-vazio">Nenhuma fatura analisada ainda.</div>
      )}

      {carga === 'pronto' && faturas.length > 0 && (
        <ul className="sf-lista">
          {faturas.map((fatura) => (
            <li key={fatura.id}>
              <article className="sf-cartao">
                <Link
                  to={`/auditoria/faturas/${fatura.id}`}
                  state={{ origem: 'analisadas' }}
                  className="sf-cartao-cabecalho"
                >
                  <span className="sf-cartao-titulo">
                    Fatura nº {fatura.numeroFatura ?? '—'} · {fatura.ocs}
                  </span>
                  <SeloSituacao situacao="AUDITADA" />
                </Link>
                <p className="sf-cartao-resumo">
                  Visualizada em{' '}
                  {fatura.dataVisualizacao ? formatarDataCurta(fatura.dataVisualizacao) : '—'} por{' '}
                  {fatura.responsavelVisualizacao ?? '—'} · Informado: {formatarMoeda(fatura.valorInformado)} · Glosa:{' '}
                  {formatarMoeda(fatura.valorGlosa)} · Final: {formatarMoeda(fatura.valorFinal)}
                </p>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
