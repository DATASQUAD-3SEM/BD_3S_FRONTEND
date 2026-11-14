import { useEffect, useMemo, useState } from 'react'
import GuiaCard from './GuiaCard'
import { minhasGuiasApi } from './api'
import type { GuiaDoBeneficiario, SituacaoGuia } from './types'
import './minhasGuias.css'

/**
 * T18-FE-1 — Minhas guias (lista de guias do beneficiário).
 *
 * Estados: carregando (skeleton), erro ("Tentar novamente"), lista vazia e filtro sem itens.
 *
 * O filtro "Mostrar" é feito na própria tela, sobre a lista já carregada: trocar de opção
 * NÃO chama o servidor e preserva a ordem que o backend enviou (data de inserção desc).
 *
 * O `setEstado('carregando')` do retry fica no handler `tentarNovamente`, não dentro do
 * efeito — a regra react-hooks/set-state-in-effect proíbe setState síncrono no corpo do efeito.
 */

export type FiltroMostrar = 'todas' | 'em-andamento' | 'finalizadas'

const EM_ANDAMENTO: SituacaoGuia[] = ['NAO_ENVIADA', 'ENVIADA', 'EM_EXECUCAO']
const FINALIZADAS: SituacaoGuia[] = ['REALIZADA', 'ENCERRADA', 'VENCIDA']

type Estado = 'carregando' | 'pronto' | 'erro'

//Página "Minhas guias": busca as guias do beneficiário e controla carregando, erro, vazio e filtro
export default function MinhasGuiasPage() {
  const [estado, setEstado] = useState<Estado>('carregando')
  const [guias, setGuias] = useState<GuiaDoBeneficiario[]>([])
  const [filtro, setFiltro] = useState<FiltroMostrar>('todas')
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let cancelado = false
    minhasGuiasApi
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

  const filtradas = useMemo(() => {
    if (filtro === 'todas') return guias
    const permitidas = filtro === 'em-andamento' ? EM_ANDAMENTO : FINALIZADAS
    return guias.filter((g) => permitidas.includes(g.situacao))
  }, [guias, filtro])

  return (
    <section className="mg-pagina">
      <h1>Minhas guias</h1>

      {estado === 'carregando' && (
        <div data-testid="skeleton" aria-busy="true" aria-label="Carregando guias">
          {[1, 2, 3].map((n) => (
            <div key={n} className="mg-skeleton" />
          ))}
        </div>
      )}

      {estado === 'erro' && (
        <div role="alert" className="mg-estado-erro">
          <p>Não foi possível carregar suas guias.</p>
          <button type="button" className="botao botao-primario" onClick={tentarNovamente}>
            Tentar novamente
          </button>
        </div>
      )}

      {estado === 'pronto' && guias.length === 0 && (
        <p className="mg-estado-vazio">
          Você ainda não tem guias. Elas aparecem aqui quando a sua pré-guia estiver concluída.
        </p>
      )}

      {estado === 'pronto' && guias.length > 0 && (
        <>
          <div className="mg-filtro">
            <label htmlFor="mg-filtro-mostrar">Mostrar</label>
            <select
              id="mg-filtro-mostrar"
              value={filtro}
              onChange={(e) => setFiltro(e.target.value as FiltroMostrar)}
            >
              <option value="todas">Todas</option>
              <option value="em-andamento">Em andamento</option>
              <option value="finalizadas">Finalizadas</option>
            </select>
          </div>

          {filtradas.length === 0 ? (
            <p className="mg-estado-vazio">
              {filtro === 'em-andamento' ? 'Nenhuma guia em andamento.' : 'Nenhuma guia finalizada.'}
            </p>
          ) : (
            <div className="mg-lista">
              {filtradas.map((guia) => (
                <GuiaCard key={guia.id} guia={guia} />
              ))}
            </div>
          )}
        </>
      )}
    </section>
  )
}
