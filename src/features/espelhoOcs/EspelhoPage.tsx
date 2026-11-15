import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import CartaoEspelhoEmConstrucao from './CartaoEspelhoEmConstrucao'
import HistoricoEspelhos from './HistoricoEspelhos'
import { espelhoApi } from './api'
import { contarGuias } from './formatadores'
import type { Espelho } from './types'
import './espelhoOcs.css'

type Estado = 'carregando' | 'pronto' | 'erro'

export default function EspelhoPage() {
  const [estado, setEstado] = useState<Estado>('carregando')
  const [espelho, setEspelho] = useState<Espelho | null>(null)
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let cancelado = false
    espelhoApi
      .buscarEmConstrucao()
      .then((resposta) => {
        if (cancelado) return
        setEspelho(resposta)
        setEstado('pronto')
      })
      .catch(() => {
        if (cancelado) return
        setEstado('erro')
      })
    return () => {
      cancelado = true
    }
  }, [tentativa])

  function tentarNovamente() {
    setEstado('carregando')
    setTentativa((n) => n + 1)
  }

  return (
    <section className="oe-pagina">
      <h1>Espelho</h1>
      <p className="oe-subtitulo">
        O espelho que você está construindo agora, guia por guia, e o histórico dos que já foram enviados ao FUSEX.
      </p>

      {estado === 'carregando' && (
        <div data-testid="skeleton-espelho" aria-busy="true" aria-label="Carregando espelho" className="oe-skeleton" />
      )}

      {estado === 'erro' && (
        <div role="alert" className="oe-estado-erro">
          <p>Não foi possível carregar o espelho.</p>
          <button type="button" className="botao botao-primario" onClick={tentarNovamente}>
            Tentar novamente
          </button>
        </div>
      )}

      {estado === 'pronto' && espelho && (
        espelho.id !== null && espelho.itens.length > 0 ? (
          <CartaoEspelhoEmConstrucao
            id={espelho.id}
            dataInicio={espelho.dataInicio}
            quantidadeGuias={contarGuias(espelho.itens)}
            valorTotal={espelho.valorTotal}
          />
        ) : (
          <div className="oe-vazio">
            <p>Nenhuma guia adicionada ainda.</p>
            <Link className="botao botao-primario" to="/ocs/guias-finalizadas">
              Adicionar guia
            </Link>
          </div>
        )
      )}

      <h2>Histórico de espelhos enviados</h2>
      <HistoricoEspelhos />
    </section>
  )
}
