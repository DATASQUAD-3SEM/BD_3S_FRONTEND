import { useEffect, useState } from 'react'

/** Devolve o valor só depois de ficar estável pelo tempo informado. */
export function useDebounce<T>(valor: T, atraso = 300): T {
  const [debounced, setDebounced] = useState(valor)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(valor), atraso)
    return () => clearTimeout(timer)
  }, [valor, atraso])

  return debounced
}
