import { useState } from 'react'

interface Procedimento {
  id: number
  nome: string
  codigo?: string
}

interface Props {
  ocsId: number | null
  value: number[]
  onChange: (procedimentoIds: number[]) => void
}

export default function SelecaoProcedimentos({ ocsId, value, onChange }: Props) {
  const [busca, setBusca] = useState('')

  // TODO: Substituir por consulta real via listarProcedimentosDaOcs(ocsId) quando a API estiver conectada
  const procedimentosDisponiveis: Procedimento[] = [
    { id: 1, nome: 'Consulta Médica Especializada', codigo: '10101012' },
    { id: 2, nome: 'Hemograma Completo', codigo: '40304361' },
    { id: 3, nome: 'Raio-X de Tórax', codigo: '40808041' },
    { id: 4, nome: 'Ultrassonografia Abdominal', codigo: '40901203' },
    { id: 5, nome: 'Ressonância Magnética', codigo: '40902013' },
  ]

  const procedimentosFiltrados = procedimentosDisponiveis.filter(
    (p) =>
      p.nome.toLowerCase().includes(busca.toLowerCase()) ||
      (p.codigo && p.codigo.includes(busca)),
  )

  const toggleProcedimento = (id: number) => {
    if (value.includes(id)) onChange(value.filter((itemId) => itemId !== id))
    else onChange([...value, id])
  }

  const removerProcedimento = (id: number) => {
    onChange(value.filter((itemId) => itemId !== id))
  }

  if (!ocsId) {
    return (
      <section className="painel">
        <p
          style={{
            color: '#92400e',
            background: '#fef3c7',
            padding: '0.75rem',
            borderRadius: '6px',
            margin: 0,
          }}
        >
          Por favor, selecione uma OCS na etapa anterior antes de escolher os procedimentos.
        </p>
      </section>
    )
  }

  return (
    <section className="painel">
      <h2>Seleção de Procedimentos e Exames</h2>
      <p>Selecione os exames e procedimentos indicados no seu encaminhamento médico.</p>

      <label htmlFor="busca-procedimento">Buscar Exame ou Procedimento</label>
      <input
        id="busca-procedimento"
        type="text"
        placeholder="Digite o nome ou código do procedimento..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ width: '100%', marginBottom: '0.75rem' }}
      />

      {procedimentosFiltrados.length === 0 ? (
        <p>Nenhum procedimento encontrado.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 1rem' }}>
          {procedimentosFiltrados.map((proc) => {
            const selecionado = value.includes(proc.id)
            return (
              <li key={proc.id} style={{ marginBottom: '0.5rem' }}>
                <label
                  style={{
                    display: 'flex',
                    gap: '0.5rem',
                    cursor: 'pointer',
                    alignItems: 'flex-start',
                    background: selecionado ? '#eef5f0' : 'transparent',
                    padding: '0.4rem 0.5rem',
                    borderRadius: '6px',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={selecionado}
                    onChange={() => toggleProcedimento(proc.id)}
                    style={{ marginTop: '0.25rem' }}
                  />
                  <span>
                    <strong>{proc.nome}</strong>
                    {proc.codigo && (
                      <>
                        <br />
                        <small>Código: {proc.codigo}</small>
                      </>
                    )}
                  </span>
                </label>
              </li>
            )
          })}
        </ul>
      )}

      <h4>Itens selecionados ({value.length})</h4>
      {value.length === 0 ? (
        <p>Nenhum exame selecionado até o momento.</p>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
          {value.map((id) => {
            const item = procedimentosDisponiveis.find((p) => p.id === id)
            return (
              <span
                key={id}
                style={{
                  background: '#e8f2ea',
                  color: '#1a3d2e',
                  borderRadius: '999px',
                  padding: '0.25rem 0.75rem',
                  fontSize: '0.85rem',
                }}
              >
                {item?.nome || `Procedimento #${id}`}{' '}
                <button
                  type="button"
                  onClick={() => removerProcedimento(id)}
                  style={{
                    background: 'none',
                    border: 0,
                    color: '#1a3d2e',
                    cursor: 'pointer',
                    minHeight: 'auto',
                    padding: 0,
                    marginLeft: '0.25rem',
                    fontWeight: 700,
                  }}
                  aria-label={`Remover ${item?.nome ?? id}`}
                >
                  ×
                </button>
              </span>
            )
          })}
        </div>
      )}
    </section>
  )
}
