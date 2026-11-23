import { useEffect, useState } from 'react'
import { chefeDependentesApi } from './api'
import CartaoDependente, { ordenarVigentesPrimeiro } from './CartaoDependente'
import type { ChefeDependentesApi, DependentesDoTitular } from './tipos'
import './dependentes.css'

interface Props {
  titularId: number
  api?: ChefeDependentesApi
  onVoltar?: () => void
  onAdicionar?: () => void
  onEditar?: (dependenteId: number) => void
}

type Carga = 'carregando' | 'pronto' | 'erro'

/**
 * Dependentes do titular (T31-FE2): um cartão por dependente, vigentes primeiro e os de vigência vencida no fim,
 * com "Editar" (o chefe pode estender a vigência). Sem remover nem encerrar nesta versão.
 */
export default function DependentesTitularPage({
  titularId,
  api = chefeDependentesApi,
  onVoltar,
  onAdicionar,
  onEditar,
}: Props) {
  const [dados, setDados] = useState<DependentesDoTitular | null>(null)
  const [carga, setCarga] = useState<Carga>('carregando')

  useEffect(() => {
    let ativo = true
    api
      .listar(titularId)
      .then((resposta) => {
        if (!ativo) return
        setDados(resposta)
        setCarga('pronto')
      })
      .catch(() => {
        if (ativo) setCarga('erro')
      })
    return () => {
      ativo = false
    }
  }, [api, titularId])

  const titular = dados?.titularNome ?? '…'
  const dependentes = dados ? ordenarVigentesPrimeiro(dados.dependentes) : []

  return (
    <div className="dep-pagina">
      <nav className="dep-trilha" aria-label="Trilha">
        <button type="button" className="dep-link" onClick={() => onVoltar?.()}>
          Beneficiários
        </button>{' '}
        › {titular} › Dependentes
      </nav>

      <header className="dep-cabecalho">
        <h1>Dependentes de {titular}</h1>
        <button type="button" className="dep-botao" onClick={() => onAdicionar?.()}>
          + Adicionar dependente
        </button>
      </header>
      <p className="dep-frase">Todo dependente pertence a um titular. O chefe do FUSEX cadastra e mantém os dependentes.</p>

      {carga === 'carregando' && <p role="status">Carregando dependentes…</p>}
      {carga === 'erro' && <p role="alert">Não foi possível carregar os dependentes.</p>}

      {carga === 'pronto' && dependentes.length === 0 && (
        <p className="dep-vazio">Nenhum dependente atribuído a este beneficiário.</p>
      )}

      {carga === 'pronto' && dependentes.length > 0 && (
        <ul className="dep-lista">
          {dependentes.map((dependente) => (
            <li key={dependente.dependenteId}>
              <CartaoDependente
                dependente={dependente}
                acoes={
                  <button type="button" className="dep-botao dep-botao--secundario" onClick={() => onEditar?.(dependente.dependenteId)}>
                    Editar
                  </button>
                }
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
