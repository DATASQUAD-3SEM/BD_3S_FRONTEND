import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../../shared/api/http'
import { formatarDataCurta, formatarMoeda } from '../setorFatura/formatadores'
import '../setorFatura/setorFatura.css'

/** Fatura com glosa pendente de decisão da OCS (GlosaResumoResponse, T27-BE1). */
export interface GlosaResumo {
  id: number;
  /** Nome da OCS (T27-BE1). */
  ocs?: string;
  numeroFatura: string | null;
  dataEnvioOcs: string | null;
  prazoOcs: string | null;
  prazoVencido: boolean;
  valorInformado: number;
  valorGlosa: number | null;
  valorFinal: number | null;
}

export interface GlosasApi {
  listar(): Promise<GlosaResumo[]>;
}

export const glosasApi: GlosasApi = {
  listar: () => get<GlosaResumo[]>('/ocs/glosas'),
}

interface Props {
  api?: GlosasApi
}

type Carga = 'carregando' | 'pronto' | 'erro'

/**
 * Tela "Glosas Recebidas" da OCS (T27-FE1): faturas Aguardando a OCS que ainda não tiveram decisão. Clicar abre o
 * detalhe (T27-FE2, ainda em construção). O nome da OCS não aparece: o resumo não o traz e a lista já é da própria OCS.
 */
export default function GlosasRecebidasPage({ api = glosasApi }: Props) {
  const [glosas, setGlosas] = useState<GlosaResumo[]>([])
  const [carga, setCarga] = useState<Carga>('carregando')

  useEffect(() => {
    let ativo = true
    api
      .listar()
      .then((dados) => {
        if (!ativo) return
        setGlosas(dados)
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
        <h1>Glosas Recebidas</h1>
        <p className="sf-subtitulo">
          Faturas com glosa lisurada pelo FUSEX. Para cada guia glosada, dê 'Ok' ou 'Contestar' (com o motivo) em até 3
          dias úteis. Se contestar alguma guia, ela volta para a rastreabilidade revisar. Passado o prazo sem decisão, a
          fatura segue para a auditoria mesmo assim.
        </p>
      </header>

      {carga === 'carregando' && (
        <div className="sf-vazio" role="status">
          Carregando glosas…
        </div>
      )}

      {carga === 'erro' && (
        <div className="sf-vazio sf-vazio--erro" role="alert">
          Não foi possível carregar as glosas.
        </div>
      )}

      {carga === 'pronto' && glosas.length === 0 && (
        <div className="sf-vazio">Nenhuma glosa pendente de decisão.</div>
      )}

      {carga === 'pronto' && glosas.length > 0 && (
        <ul className="sf-lista">
          {glosas.map((glosa) => (
            <li key={glosa.id}>
              <article className="sf-cartao">
                <Link to={`/ocs/glosas/${glosa.id}`} className="sf-cartao-cabecalho">
                  <span className="sf-cartao-titulo">
                    Fatura nº {glosa.numeroFatura ?? '—'}
                    {glosa.ocs ? ` · ${glosa.ocs}` : ''}
                  </span>
                  <span className={glosa.prazoVencido ? 'sf-selo sf-selo--vermelho' : 'sf-selo sf-selo--azul'}>
                    {glosa.prazoVencido ? 'Prazo vencido' : 'Aguardando decisão'}
                  </span>
                </Link>
                <p className="sf-cartao-resumo">
                  Glosa: {formatarMoeda(glosa.valorGlosa)} · Valor final: {formatarMoeda(glosa.valorFinal)} ·{' '}
                  {glosa.prazoVencido
                    ? `Prazo vencido em ${formatarDataCurta(glosa.prazoOcs)}`
                    : `Prazo: até ${formatarDataCurta(glosa.prazoOcs)}`}
                </p>
              </article>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
