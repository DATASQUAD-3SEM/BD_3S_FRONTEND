import { useEffect, useState } from 'react'
import CartaoGuiaFinalizada from './CartaoGuiaFinalizada'
import { guiasFinalizadasApi } from './api'
import type { GuiaFinalizada } from './types'
import './guiasFinalizadas.css'

type Estado = 'carregando' | 'pronto' | 'erro'

export default function GuiasFinalizadasPage() {
  const [estado, setEstado] = useState<Estado>('carregando')
  const [guias, setGuias] = useState<GuiaFinalizada[]>([])
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let cancelado = false
    guiasFinalizadasApi
      .listar()
      .then((lista) => {
        if (cancelado) return
        setGuias(lista)
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

  function recarregar() {
    setTentativa((n) => n + 1)
  }

  return (
    <section className="ge-pagina">
      <h1>Guias Finalizadas</h1>
      <p className="ge-subtitulo">
        Guias realizadas ou encerradas da sua OCS. Adicione-as ao espelho e informe o valor por sessão.
      </p>

      {estado === 'carregando' && (
        <div data-testid="skeleton-guias" aria-busy="true" aria-label="Carregando guias finalizadas">
          {[1, 2].map((n) => (
            <div key={n} className="ge-skeleton" />
          ))}
        </div>
      )}

      {estado === 'erro' && (
        <div role="alert" className="estado-erro">
          <p>Não foi possível carregar as guias finalizadas.</p>
          <button type="button" className="botao botao-primario" onClick={tentarNovamente}>
            Tentar novamente
          </button>
        </div>
      )}

      {/* T20-FE2 (regra 10.7): nenhuma guia com "Adicionar para o espelho" (lista vazia ou todas ja vinculadas) */}
      {estado === 'pronto' && !guias.some((guia) => guia.vinculo === 'DISPONIVEL') && (
        <p className="ge-vazio">Nenhuma guia finalizada disponível para o espelho no momento.</p>
      )}

      {estado === 'pronto' && guias.length > 0 && (
        <div className="ge-lista">
          {guias.map((guia) => (
            <CartaoGuiaFinalizada key={guia.id} guia={guia} onAlterado={recarregar} />
          ))}
        </div>
      )}
    </section>
  )
}
