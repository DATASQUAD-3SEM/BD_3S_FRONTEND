import { useEffect, useMemo, useState } from 'react'
import { listarOcs } from '../../../ocs/api'
import { ApiError } from '../../../../shared/api/http'
import type { Ocs } from '../../../../shared/types/domain'

interface Props {
  value: number | null
  onChange: (ocsId: number | null) => void
}

/** SCRUM 35 - escolher a OCS (usa listarOcs de features/ocs/api.ts). */
export default function SelecaoOcs({ value, onChange }: Props) {
  const [ocs, setOcs] = useState<Ocs[]>([])
  const [busca, setBusca] = useState('')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    listarOcs()
      .then((lista) => {
        if (!ativo) return
        setOcs(lista)
        setErro(null)
      })
      .catch((e: unknown) => {
        if (!ativo) return
        const msg = e instanceof ApiError ? e.message : 'Erro ao carregar as OCS'
        setErro(msg)
        setOcs([])
      })
      .finally(() => {
        if (ativo) setCarregando(false)
      })
    return () => {
      ativo = false
    }
  }, [])

  const filtradas = useMemo(() => {
    const termo = busca.trim().toLowerCase()
    if (!termo) return ocs
    return ocs.filter(
      (o) =>
        o.nome.toLowerCase().includes(termo) ||
        o.contratoNum.toLowerCase().includes(termo) ||
        (o.tipo ?? '').toLowerCase().includes(termo),
    )
  }, [ocs, busca])

  const selecionada = ocs.find((o) => o.id === value) ?? null

  return (
    <section className="painel">
      <h2>OCS</h2>
      <p>Escolha a rede credenciada onde o exame sera realizado.</p>

      {carregando && <p>Carregando OCS...</p>}

      {!carregando && erro && (
        <div className="erro" role="alert">
          <p>
            <strong>Nao foi possivel carregar as OCS.</strong>
          </p>
          <p>{erro}</p>
        </div>
      )}

      {!carregando && !erro && (
        <>
          <label htmlFor="busca-ocs">Buscar OCS</label>
          <input
            id="busca-ocs"
            type="text"
            placeholder="Digite o nome, contrato ou tipo..."
            value={busca}
            onChange={(e) => setBusca(e.target.value)}
            style={{ width: '100%', marginBottom: '0.75rem' }}
          />

          {filtradas.length === 0 ? (
            <p>Nenhuma OCS encontrada.</p>
          ) : (
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {filtradas.map((o) => (
                <li key={o.id} style={{ marginBottom: '0.5rem' }}>
                  <label
                    style={{
                      display: 'flex',
                      gap: '0.5rem',
                      cursor: 'pointer',
                      alignItems: 'flex-start',
                    }}
                  >
                    <input
                      type="radio"
                      name="ocs"
                      checked={value === o.id}
                      onChange={() => onChange(o.id)}
                      style={{ marginTop: '0.25rem' }}
                    />
                    <span>
                      <strong>{o.nome}</strong>
                      <br />
                      <small>
                        Contrato: {o.contratoNum}
                        {o.tipo ? ` · ${o.tipo}` : ''}
                      </small>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}

          {selecionada && (
            <p className="ok" role="status">
              OCS selecionada: {selecionada.nome}
            </p>
          )}
        </>
      )}
    </section>
  )
}
