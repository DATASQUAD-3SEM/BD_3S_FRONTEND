import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { corrigirPreGuiasApi } from './corrigirPreGuiasApi'
import PreGuiaCorrecaoCard from './components/PreGuiaCorrecaoCard'
import type { CorrigirPreGuiasApi, PreGuiaParaCorrigir } from './types'
import './corrigirPreGuias.css'

/**
 * Tela 14 - Corrigir pre-guias (T14-FE1): lista as pre-guias criadas pelo medico logado que o Setor de Guias
 * devolveu em Atencao. Sem pendencias, mostra a mensagem de lista vazia.
 */

type Estado =
  | { tipo: 'carregando' }
  | { tipo: 'erro' }
  | { tipo: 'pronto'; itens: PreGuiaParaCorrigir[] }

interface Props {
  api?: CorrigirPreGuiasApi
}

export default function CorrigirPreGuiasPage({ api = corrigirPreGuiasApi }: Props) {
  const navigate = useNavigate()
  const location = useLocation()
  const mensagemSalva = (location.state as { mensagem?: string } | null)?.mensagem
  const [estado, setEstado] = useState<Estado>({ tipo: 'carregando' })
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let ativo = true
    api
      .listarParaCorrigir()
      .then((itens) => {
        if (ativo) setEstado({ tipo: 'pronto', itens })
      })
      .catch(() => {
        if (ativo) setEstado({ tipo: 'erro' })
      })
    return () => {
      ativo = false
    }
  }, [api, tentativa])

  function tentarNovamente() {
    setEstado({ tipo: 'carregando' })
    setTentativa((t) => t + 1)
  }

  return (
    <section className="corrigir-pre-guias" aria-labelledby="titulo-corrigir-pre-guias">
      <h1 id="titulo-corrigir-pre-guias">Corrigir pré-guias</h1>
      <p className="corrigir-pre-guias__apoio">
        Aparecem aqui somente as pré-guias criadas por você que o setor de Guias devolveu para
        correção.
      </p>

      {mensagemSalva && (
        <p role="status" className="corrigir-pre-guias__sucesso">
          {mensagemSalva}
        </p>
      )}

      {estado.tipo === 'carregando' && (
        <div
          className="corrigir-pre-guias__skeleton"
          aria-busy="true"
          aria-label="Carregando pré-guias"
          data-testid="skeleton"
        >
          <div className="corrigir-pre-guias__skeleton-card" />
          <div className="corrigir-pre-guias__skeleton-card" />
        </div>
      )}

      {estado.tipo === 'erro' && (
        <div role="alert" className="corrigir-pre-guias__erro">
          <p>Não foi possível carregar as pré-guias para correção.</p>
          <button type="button" className="botao botao-primario" onClick={tentarNovamente}>
            Tentar novamente
          </button>
        </div>
      )}

      {estado.tipo === 'pronto' && estado.itens.length === 0 && (
        <div className="corrigir-pre-guias__vazio">
          <h2>Nenhuma pré-guia para corrigir</h2>
          <p>Quando o setor de Guias devolver uma pré-guia sua, ela aparecerá aqui.</p>
        </div>
      )}

      {estado.tipo === 'pronto' &&
        estado.itens.map((preGuia) => (
          <PreGuiaCorrecaoCard
            key={preGuia.id}
            preGuia={preGuia}
            onCorrigir={(id) => navigate(`/medico/corrigir-pre-guias/${id}`)}
          />
        ))}
    </section>
  )
}
