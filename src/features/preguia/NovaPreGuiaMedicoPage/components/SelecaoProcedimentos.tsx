import { useEffect, useState } from 'react'
import { ApiError } from '../../../../shared/api/http'
import { buscarProcedimentos } from '../../../medicos/api'
import type { ProcedimentoOpcao } from '../../../medicos/types'

interface Props {
  value: ProcedimentoOpcao[]
  onChange: (procedimentos: ProcedimentoOpcao[]) => void
}

/** Escolher >= 1 procedimento do catalogo inteiro (sem filtro por OCS). */
export default function SelecaoProcedimentos({ value, onChange }: Props) {
  const [busca, setBusca] = useState('')
  const [resultados, setResultados] = useState<ProcedimentoOpcao[]>([])
  const [buscando, setBuscando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const termo = busca.trim()

  useEffect(() => {
    if (termo.length < 2) return

    let ativo = true
    const espera = setTimeout(() => {
      setBuscando(true)
      buscarProcedimentos(termo)
        .then((lista) => {
          if (!ativo) return
          setResultados(lista)
          setErro(null)
        })
        .catch((e: unknown) => {
          if (!ativo) return
          setErro(e instanceof ApiError ? e.message : 'Erro ao buscar procedimentos')
          setResultados([])
        })
        .finally(() => {
          if (ativo) setBuscando(false)
        })
    }, 300)

    return () => {
      ativo = false
      clearTimeout(espera)
    }
  }, [termo])

  const idsEscolhidos = new Set(value.map((p) => p.id))
  const disponiveis = termo.length < 2 ? [] : resultados.filter((p) => !idsEscolhidos.has(p.id))

  return (
    <section className="painel">
      <h2>Procedimentos e exames</h2>
      <p>Inclua ao menos um procedimento. Qualquer procedimento do catálogo pode ser usado com qualquer OCS.</p>

      <label htmlFor="busca-procedimento">Buscar procedimento</label>
      <input
        id="busca-procedimento"
        type="text"
        placeholder="Digite o nome ou o código TUSS..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ width: '100%', marginBottom: '0.75rem' }}
      />

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}

      {termo.length >= 2 && (
        <>
          {buscando && <p>Buscando procedimentos...</p>}
          {!buscando && !erro && disponiveis.length === 0 && <p>Nenhum procedimento encontrado.</p>}
          {disponiveis.length > 0 && (
            <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem' }}>
              {disponiveis.map((p) => (
                <li key={p.id} style={{ marginBottom: '0.5rem' }}>
                  <strong>{p.terminologiaProcedimento}</strong>
                  <br />
                  <small>
                    TUSS {p.codigoTuss} · {p.subgrupo}
                  </small>{' '}
                  <button type="button" onClick={() => onChange([...value, p])}>
                    Adicionar {p.terminologiaProcedimento}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      <h3>Procedimentos na pré-guia ({value.length})</h3>
      {value.length === 0 ? (
        <p>Nenhum procedimento adicionado ainda.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {value.map((p) => (
            <li key={p.id} style={{ marginBottom: '0.5rem' }}>
              <strong>{p.terminologiaProcedimento}</strong>
              <br />
              <small>
                TUSS {p.codigoTuss}
                {p.rolAns === 'NAO' ? ' · Fora do Rol ANS' : ''}
              </small>{' '}
              <button type="button" onClick={() => onChange(value.filter((x) => x.id !== p.id))}>
                Remover {p.terminologiaProcedimento}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
