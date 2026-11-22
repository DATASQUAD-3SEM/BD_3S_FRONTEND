import { useEffect, useState } from 'react'
import { setorFaturasApi } from './api'
import ControleFluxoFatura from './components/ControleFluxoFatura'
import { formatarDataCurta, formatarMoeda } from './formatadores'
import type { EspelhoDetalhe, FaturaAuditada, SetorFaturasApi } from './types'
import './setorFatura.css'

interface Props {
  api?: SetorFaturasApi
}

type Carga = 'carregando' | 'pronto' | 'erro'

/**
 * Aba "Faturas Auditadas" do Setor de Faturas (T24-FE4): um cartão por fatura Auditada, da visualização mais
 * recente para a mais antiga, com o selo "Concluída". Clicar abre o detalhe só de leitura: resumo, tabela das
 * guias e o controle de fluxo completo (com a linha Arquivo).
 */
export default function AuditadasPage({ api = setorFaturasApi }: Props) {
  const [faturas, setFaturas] = useState<FaturaAuditada[]>([])
  const [carga, setCarga] = useState<Carga>('carregando')
  const [abertaId, setAbertaId] = useState<number | null>(null)
  const [detalhes, setDetalhes] = useState<Record<number, EspelhoDetalhe>>({})
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)
  const [erroDetalhe, setErroDetalhe] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    api
      .listarAuditadas()
      .then((dados) => {
        if (!ativo) return
        setFaturas(ordenarPorVisualizacao(dados))
        setCarga('pronto')
      })
      .catch(() => {
        if (ativo) setCarga('erro')
      })
    return () => {
      ativo = false
    }
  }, [api])

  async function alternar(id: number) {
    if (abertaId === id) {
      setAbertaId(null)
      return
    }
    setAbertaId(id)
    setErroDetalhe(null)
    if (detalhes[id]) return
    setCarregandoDetalhe(true)
    try {
      const detalhe = await api.detalharEspelho(id)
      setDetalhes((atuais) => ({ ...atuais, [id]: detalhe }))
    } catch {
      setErroDetalhe('Não foi possível carregar o detalhe da fatura.')
    } finally {
      setCarregandoDetalhe(false)
    }
  }

  return (
    <section className="sf">
      <header className="sf-cabecalho">
        <h1>Faturas Auditadas</h1>
        <p className="sf-subtitulo">
          Faturas já lisuradas e visualizadas pela auditoria. Este é o fim do fluxo no Nexus: a liquidação é feita
          fora do sistema.
        </p>
      </header>

      {carga === 'carregando' && (
        <div className="sf-vazio" role="status">
          Carregando faturas auditadas…
        </div>
      )}

      {carga === 'erro' && (
        <div className="sf-vazio sf-vazio--erro" role="alert">
          Não foi possível carregar as faturas auditadas.
        </div>
      )}

      {carga === 'pronto' && faturas.length === 0 && <div className="sf-vazio">Nenhuma fatura auditada ainda.</div>}

      {carga === 'pronto' && faturas.length > 0 && (
        <ul className="sf-lista">
          {faturas.map((fatura) => {
            const aberta = abertaId === fatura.id
            const detalhe = detalhes[fatura.id] ?? null
            return (
              <li key={fatura.id}>
                <article className={`sf-cartao${aberta ? ' sf-cartao--aberto' : ''}`}>
                  <button
                    type="button"
                    className="sf-cartao-cabecalho"
                    aria-expanded={aberta}
                    aria-controls={`sf-auditada-${fatura.id}`}
                    onClick={() => alternar(fatura.id)}
                  >
                    <span className="sf-cartao-titulo">
                      Fatura nº {fatura.numeroFatura ?? '—'} · {fatura.ocs}
                    </span>
                    <span className="sf-selo sf-selo--verde">Concluída</span>
                  </button>

                  <p className="sf-cartao-resumo">
                    Concluída em {formatarDataCurta(fatura.dataVisualizacao)} · Informado:{' '}
                    {formatarMoeda(fatura.valorInformado)} · Glosa: {formatarMoeda(fatura.valorGlosa)} · Final:{' '}
                    {formatarMoeda(fatura.valorFinal)}
                  </p>

                  {aberta && (
                    <div id={`sf-auditada-${fatura.id}`} className="sf-cartao-detalhe">
                      {carregandoDetalhe && !detalhe && (
                        <p className="sf-pequeno" role="status">
                          Carregando detalhe…
                        </p>
                      )}
                      {erroDetalhe && (
                        <p className="sf-erro" role="alert">
                          {erroDetalhe}
                        </p>
                      )}
                      {detalhe && <DetalheAuditada fatura={fatura} detalhe={detalhe} />}
                    </div>
                  )}
                </article>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

/** Detalhe só de leitura: resumo, guias com contrato e glosa, e o controle de fluxo completo. */
function DetalheAuditada({ fatura, detalhe }: { fatura: FaturaAuditada; detalhe: EspelhoDetalhe }) {
  return (
    <>
      <p className="sf-cartao-protocolo">
        Valor informado: {formatarMoeda(detalhe.totais.informado)} · Glosa: {formatarMoeda(detalhe.totais.glosa)} ·
        Valor final após lisura: {formatarMoeda(detalhe.totais.final)} · Período:{' '}
        {formatarDataCurta(fatura.dataInicio)} a {formatarDataCurta(fatura.dataEnvio)}
      </p>

      <div className="sf-tabela-wrapper">
        <table className="sf-tabela">
          <thead>
            <tr>
              <th scope="col">Guia nº</th>
              <th scope="col">Procedimento</th>
              <th scope="col">Qtd.</th>
              <th scope="col">Informado (R$/sessão)</th>
              <th scope="col">Contrato (R$/sessão)</th>
              <th scope="col">Glosa (R$)</th>
              <th scope="col">Observação</th>
            </tr>
          </thead>
          <tbody>
            {detalhe.linhas.map((linha) => (
              <tr key={linha.itemId}>
                <td>{linha.guiaNumero}</td>
                <td>{linha.procedimento}</td>
                <td>{linha.quantidadeSessoes}</td>
                <td>{formatarMoeda(linha.valorSessao)}</td>
                <td>{formatarMoeda(linha.valorContrato)}</td>
                <td>{formatarMoeda(linha.glosa)}</td>
                <td>{linha.observacao ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ControleFluxoFatura etapas={detalhe.controleFluxo} />
    </>
  )
}

/** Da visualização mais recente para a mais antiga; sem data de visualização vai para o fim. */
function ordenarPorVisualizacao(faturas: FaturaAuditada[]): FaturaAuditada[] {
  return [...faturas].sort((a, b) => {
    if (a.dataVisualizacao === b.dataVisualizacao) return b.id - a.id
    if (!a.dataVisualizacao) return 1
    if (!b.dataVisualizacao) return -1
    return b.dataVisualizacao.localeCompare(a.dataVisualizacao)
  })
}
