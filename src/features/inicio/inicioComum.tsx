import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Icone, type NomeIcone } from './icones'

/** T35: peças comuns das páginas Início (carregamento de uma lista e cartão de pendência). */

export type Carga<T> = { estado: 'carregando' } | { estado: 'ok'; dados: T } | { estado: 'erro' }

/** Carrega uma vez, ao abrir a página. Cada lista tem o próprio estado: a falha de uma não derruba as outras. */
export function useCarga<T>(carregar: () => Promise<T>): Carga<T> {
  const [carga, setCarga] = useState<Carga<T>>({ estado: 'carregando' })
  useEffect(() => {
    let ativo = true
    carregar()
      .then((dados) => ativo && setCarga({ estado: 'ok', dados }))
      .catch(() => ativo && setCarga({ estado: 'erro' }))
    return () => {
      ativo = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
  return carga
}

export interface CartaoPendenciaProps {
  icone: NomeIcone
  tom: 'alerta' | 'info' | 'sucesso' | 'destaque'
  titulo: string
  descricao: string
  quantidade: number | null
  erro: boolean
  destino: string
  acao: string
}

/** Cartão com o número de pendências: zerado fica esmaecido ("Nada pendente"); com erro, "Não foi possível carregar.". */
export function CartaoPendencia({ icone, tom, titulo, descricao, quantidade, erro, destino, acao }: CartaoPendenciaProps) {
  const vazio = !erro && quantidade === 0
  return (
    <li className={`inicio-cartao inicio-cartao--${tom}${vazio ? ' inicio-cartao--vazio' : ''}`} aria-label={titulo}>
      <div className="inicio-cartao-topo">
        <span className="inicio-cartao-icone" aria-hidden="true">
          <Icone nome={icone} />
        </span>
        <span className="inicio-cartao-numero" data-testid="quantidade">
          {erro ? '!' : quantidade === null ? '…' : quantidade}
        </span>
      </div>
      <h3>{titulo}</h3>
      {erro ? (
        <p className="inicio-cartao-erro">Não foi possível carregar.</p>
      ) : (
        <p className="inicio-cartao-desc">{vazio ? 'Nada pendente' : descricao}</p>
      )}
      {!erro && !vazio && quantidade !== null && (
        <Link to={destino} className="inicio-cartao-acao">
          {acao} <span aria-hidden="true">→</span>
        </Link>
      )}
    </li>
  )
}

/** Atalho com ícone, título e uma linha de descrição. */
export function Atalho({ icone, destino, titulo, descricao }: { icone: NomeIcone; destino: string; titulo: string; descricao: string }) {
  return (
    <Link to={destino} className="inicio-atalho">
      <span className="inicio-atalho-icone" aria-hidden="true">
        <Icone nome={icone} />
      </span>
      <span>
        <strong>{titulo}</strong>
        <small>{descricao}</small>
      </span>
    </Link>
  )
}
