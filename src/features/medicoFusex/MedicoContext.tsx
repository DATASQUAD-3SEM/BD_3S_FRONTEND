import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'

import type { MedicoPerfil } from '../../shared/types/domain'
import { obterMedicoLogado } from './medicoApi'

interface MedicoContexto {
  medico: MedicoPerfil | null
  carregando: boolean
  erro: string | null
  atualizarMedico: (parcial: Partial<MedicoPerfil>) => void
}

const ContextoMedico = createContext<MedicoContexto | undefined>(undefined)

export function MedicoProvider({ children }: PropsWithChildren) {
  const [medico, setMedico] = useState<MedicoPerfil | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  function atualizarMedico(parcial: Partial<MedicoPerfil>) {
    setMedico((atual) => (atual ? { ...atual, ...parcial } : atual))
  }

  useEffect(() => {
    let ativo = true

    async function carregar() {
      try {
        const dados = await obterMedicoLogado()
        if (ativo) setMedico(dados)
      } catch (error: unknown) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os dados do médico.',
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
    <ContextoMedico.Provider value={{ medico, carregando, erro, atualizarMedico }}>
      {children}
    </ContextoMedico.Provider>
  )
}

export function useMedico(): MedicoContexto {
  const contexto = useContext(ContextoMedico)

  if (contexto === undefined) {
    throw new Error('useMedico precisa ser usado dentro de MedicoProvider.')
  }

  return contexto
}
