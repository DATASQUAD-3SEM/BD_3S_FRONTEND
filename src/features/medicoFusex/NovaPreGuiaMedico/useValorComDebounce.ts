import { useEffect, useState } from 'react'

/** Devolve o valor só depois de ficar estável pelo tempo informado. */
export function useValorComDebounce<T>(valor: T, atrasoMs = 300): T {
  const [atrasado, setAtrasado] = useState(valor)

  useEffect(() => {
    const timer = setTimeout(() => setAtrasado(valor), atrasoMs)
    return () => clearTimeout(timer)
  }, [valor, atrasoMs])

  return atrasado
}
