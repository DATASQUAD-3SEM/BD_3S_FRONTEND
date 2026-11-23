import { useEffect, useMemo, useState } from 'react'
import { setorFaturasApi } from './api'
import { ordenarPorEnvioRecente } from './formatadores'
import type { EspelhoDetalhe, EspelhoResumo, SetorFaturasApi } from './types'
import CartaoEspelho from './components/CartaoEspelho'
import FiltrosEspelhos from './components/FiltrosEspelhos'
import './setorFatura.css'

interface Props {
  api?: SetorFaturasApi
}

type Carga = 'carregando' | 'pronto' | 'erro'

/**
 * Tela "Espelhos Recebidos" do Setor de Faturas (T24-FE1): mostra os espelhos enviados pelas OCS e as faturas
 * em andamento, com filtros de OCS e Situação feitos na tela e o detalhe de cada item (guias + controle de fluxo).
 * Faturas Auditadas não aparecem aqui (têm aba própria, T24-FE4).
 */
export default function EspelhosRecebidosPage({ api = setorFaturasApi }: Props) {
  const [espelhos, setEspelhos] = useState<EspelhoResumo[]>([])
  const [carga, setCarga] = useState<Carga>('carregando')
  const [filtroOcs, setFiltroOcs] = useState('')
  const [filtroSituacao, setFiltroSituacao] = useState('')
  const [abertoId, setAbertoId] = useState<number | null>(null)
  const [detalhes, setDetalhes] = useState<Record<number, EspelhoDetalhe>>({})
  const [carregandoDetalhe, setCarregandoDetalhe] = useState(false)
  const [erroDetalhe, setErroDetalhe] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    api
      .listarEspelhosRecebidos()
      .then((dados) => {
        if (!ativo) return
        setEspelhos(dados)
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
    () => Array.from(new Set(espelhos.map((e) => e.ocs))).sort((a, b) => a.localeCompare(b)),
    [espelhos],
  )

  const espelhosVisiveis = useMemo(() => {
    const ordenados = ordenarPorEnvioRecente(espelhos)
    return ordenados.filter((e) => {
      const ocsOk = !filtroOcs || e.ocs === filtroOcs
      const situacaoOk = !filtroSituacao || e.situacao === filtroSituacao
      return ocsOk && situacaoOk
    })
  }, [espelhos, filtroOcs, filtroSituacao])

  async function alternarCartao(id: number) {
    if (abertoId === id) {
      setAbertoId(null)
      return
    }
    setAbertoId(id)
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

  /** Protocola o espelho (T24-FE2): atualiza o detalhe e recarrega a lista. Erros vão para o formulário. */
  async function protocolar(id: number, numeroFatura: string, responsavel: string) {
    const atualizado = await api.protocolarFatura(id, { numeroFatura, responsavel })
    setDetalhes((atuais) => ({ ...atuais, [id]: atualizado }))
    setEspelhos(await api.listarEspelhosRecebidos())
  }

  /** Envia para a rastreabilidade (T24-FE3): atualiza o detalhe e recarrega a lista; a fatura sai de Protocolada. */
  async function enviarLisura(id: number, responsavel: string) {
    const atualizado = await api.enviarParaLisura(id, { responsavel })
    setDetalhes((atuais) => ({ ...atuais, [id]: atualizado }))
    setEspelhos(await api.listarEspelhosRecebidos())
  }

  return (
    <section className="sf">
      <header className="sf-cabecalho">
        <h1>Espelhos Recebidos</h1>
        <p className="sf-subtitulo">
          Espelhos que as OCS enviaram ao FUSEX. Ao inserir o nº da fatura, o espelho passa a ser uma fatura e
          pode ser enviado para a rastreabilidade.
        </p>
      </header>

      {carga === 'pronto' && (
        <FiltrosEspelhos
          ocsSelecionada={filtroOcs}
          situacaoSelecionada={filtroSituacao}
          ocsDisponiveis={ocsDisponiveis}
          onOcsChange={setFiltroOcs}
          onSituacaoChange={setFiltroSituacao}
        />
      )}

      {carga === 'carregando' && (
        <div className="sf-vazio" role="status">
          Carregando espelhos recebidos…
        </div>
      )}

      {carga === 'erro' && (
        <div className="sf-vazio sf-vazio--erro" role="alert">
          Não foi possível carregar os espelhos recebidos.
        </div>
      )}

      {carga === 'pronto' && espelhosVisiveis.length === 0 && (
        <div className="sf-vazio">Nenhum espelho recebido com esses filtros.</div>
      )}

      {carga === 'pronto' && espelhosVisiveis.length > 0 && (
        <ul className="sf-lista">
          {espelhosVisiveis.map((espelho) => (
            <li key={espelho.id}>
              <CartaoEspelho
                espelho={espelho}
                aberto={abertoId === espelho.id}
                detalhe={detalhes[espelho.id] ?? null}
                carregando={abertoId === espelho.id && carregandoDetalhe}
                erro={abertoId === espelho.id ? erroDetalhe : null}
                onToggle={alternarCartao}
                sugerirNumero={(id) => api.proximoNumeroFatura(id)}
                onProtocolar={protocolar}
                onEnviarLisura={enviarLisura}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
