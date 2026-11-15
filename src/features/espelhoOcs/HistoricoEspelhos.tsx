import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { espelhoApi } from './api'
import { formatarMoeda } from './formatadores'
import { formatarPeriodo } from './historico'
import type { Espelho } from './types'
import './historico.css'

type Estado = 'carregando' | 'pronto' | 'erro'

export default function HistoricoEspelhos() {
  const [estado, setEstado] = useState<Estado>('carregando')
  const [lista, setLista] = useState<Espelho[]>([])
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let cancelado = false
    espelhoApi
      .listarHistorico()
      .then((resposta) => {
        if (cancelado) return
        setLista(resposta)
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
    <section aria-label="Histórico de espelhos enviados">
      {estado === 'carregando' && (
        <div data-testid="skeleton-historico" aria-busy="true" aria-label="Carregando histórico" className="eh-skeleton" />
      )}

      {estado === 'erro' && (
        <div role="alert" className="estado-erro">
          <p>Não foi possível carregar o histórico de espelhos.</p>
          <button type="button" className="botao botao-primario" onClick={tentarNovamente}>
            Tentar novamente
          </button>
        </div>
      )}

      {estado === 'pronto' && lista.length === 0 && (
        <div className="eh-vazio">
          <p>Nenhum espelho enviado ainda.</p>
        </div>
      )}

      {estado === 'pronto' && lista.length > 0 && (
        <ul className="eh-lista">
          {lista.map((espelho) => (
            <li key={espelho.id ?? 0} className="eh-linha">
              <div className="eh-texto">
                <strong>{`Espelho nº ${espelho.id}`}</strong>
                <span>{formatarPeriodo(espelho.dataInicio, espelho.dataEnvio)}</span>
              </div>
              <div className="eh-valores">
                <strong>{formatarMoeda(espelho.valorTotal)}</strong>
                <Link className="botao" to={`/ocs/espelho/historico/${espelho.id}`}>
                  Ver detalhes
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
