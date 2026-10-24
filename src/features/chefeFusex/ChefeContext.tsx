import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'

import type { ChefePerfil } from '../../shared/types/domain'
import { obterChefeLogado } from './chefeApi'

interface ChefeContexto {
  chefe: ChefePerfil | null
  carregando: boolean
  erro: string | null
  atualizarChefe: (parcial: Partial<ChefePerfil>) => void
}

const ContextoChefe = createContext<ChefeContexto | undefined>(undefined)

export function ChefeProvider({ children }: PropsWithChildren) {
  const [chefe, setChefe] = useState<ChefePerfil | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  function atualizarChefe(parcial: Partial<ChefePerfil>) {
    setChefe((atual) => (atual ? { ...atual, ...parcial } : atual))
  }

  useEffect(() => {
    let ativo = true

    async function carregar() {
      try {
        const dados = await obterChefeLogado()
        if (ativo) setChefe(dados)
      } catch (error: unknown) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os dados do chefe.',
          )
        }
      } finally {
        if (ativo) setCarregando(false)
      }
    }

    void carregar()

    return () => {
      ativo = false
    }
  }, [])

  return (
    <ContextoChefe.Provider value={{ chefe, carregando, erro, atualizarChefe }}>
      {children}
    </ContextoChefe.Provider>
  )
}

export function useChefe(): ChefeContexto {
  const contexto = useContext(ContextoChefe)

  if (contexto === undefined) {
    throw new Error('useChefe precisa ser usado dentro de ChefeProvider.')
  }

  return contexto
}
