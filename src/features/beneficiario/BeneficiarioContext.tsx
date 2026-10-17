import {
  createContext,
  useContext,
  useEffect,
  useState,
  type PropsWithChildren,
} from 'react'

import type { Beneficiario } from '../../shared/types/domain'
import { obterBeneficiarioLogado } from './dadosBeneficiario'

interface BeneficiarioContexto {
  beneficiario: Beneficiario | null
  carregando: boolean
  erro: string | null
  atualizarBeneficiario: (parcial: Partial<Beneficiario>) => void
}

const ContextoBeneficiario =
  createContext<BeneficiarioContexto | undefined>(undefined)

export function BeneficiarioProvider({
                                       children,
                                     }: PropsWithChildren) {
  const [beneficiario, setBeneficiario] =
    useState<Beneficiario | null>(null)

  const [carregando, setCarregando] = useState(true)

  const [erro, setErro] = useState<string | null>(null)

  function atualizarBeneficiario(parcial: Partial<Beneficiario>) {
    setBeneficiario((atual) =>
      (atual ? { ...atual, ...parcial } : atual))
  }

  useEffect(() => {
    let ativo = true

    async function carregar() {
      try {
        const dados = await obterBeneficiarioLogado()

        if (ativo) {
          setBeneficiario(dados)
        }
      } catch (error: unknown) {
        if (ativo) {
          setErro(
            error instanceof Error
              ? error.message
              : 'Não foi possível carregar os dados do beneficiário.',
          )
        }
      } finally {
        if (ativo) {
          setCarregando(false)
        }
      }
    }

    void carregar()

    return () => {
      ativo = false
    }
  }, [])

  return (
    <ContextoBeneficiario.Provider
      value={{
        beneficiario,
        carregando,
        erro,
        atualizarBeneficiario,
      }}
    >
      {children}
    </ContextoBeneficiario.Provider>
  )
}

export function useBeneficiario(): BeneficiarioContexto {
  const contexto = useContext(ContextoBeneficiario)

  if (contexto === undefined) {
    throw new Error(
      'useBeneficiario precisa ser usado dentro de BeneficiarioProvider.',
    )
  }

  return contexto
}
