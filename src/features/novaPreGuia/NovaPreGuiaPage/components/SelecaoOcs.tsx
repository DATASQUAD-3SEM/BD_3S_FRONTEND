import { useEffect, useState } from 'react'
import { buscarOcs } from '../../ocsApi'
import { useDebounce } from '../../../../shared/hooks/useDebounce'
import { mensagemDeErro } from '../../../../shared/api/erros'
import type { OcsOpcao } from '../types'

interface Props {
  value: OcsOpcao | null
  onChange: (ocs: OcsOpcao | null) => void
}

interface ResultadoBusca {
  termo: string
  lista: OcsOpcao[]
  erro: string | null
}

/**
 * Escolha da OCS na Nova pre-guia do beneficiario. A busca e feita no servidor
 * (GET /beneficiarios/me/ocs) por nome, contrato ou tipo, com debounce de 300 ms.
 */
export default function SelecaoOcs({ value, onChange }: Props) {
  const [busca, setBusca] = useState('')
  const termo = useDebounce(busca.trim(), 300)
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null)

  useEffect(() => {
    let ativo = true
    buscarOcs(termo)
      .then((lista) => {
        if (ativo) setResultado({ termo, lista, erro: null })
      })
      .catch((e: unknown) => {
        if (ativo) setResultado({ termo, lista: [], erro: mensagemDeErro(e, 'Erro ao carregar as OCS') })
      })
    return () => {
      ativo = false
    }
  }, [termo])

  // Carregando enquanto o resultado ainda nao corresponde ao termo digitado
  const carregando = resultado === null || resultado.termo !== termo
  const lista = resultado?.lista ?? []

  return (
    <section className="painel">
      <h2>OCS</h2>
      <p>Escolha a rede credenciada onde o exame sera realizado.</p>

      <label htmlFor="busca-ocs">Buscar OCS</label>
      <input
        id="busca-ocs"
        type="text"
        placeholder="Digite o nome, contrato ou tipo..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        style={{ width: '100%', marginBottom: '0.75rem' }}
      />

      {carregando && <p>Carregando OCS...</p>}

      {!carregando && resultado?.erro && (
        <div className="erro" role="alert">
          <p>
            <strong>Nao foi possivel carregar as OCS.</strong>
          </p>
          <p>{resultado.erro}</p>
        </div>
      )}

      {!carregando && !resultado?.erro && lista.length === 0 && <p>Nenhuma OCS encontrada.</p>}

      {!carregando && !resultado?.erro && lista.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {lista.map((o) => (
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
                  checked={value?.id === o.id}
                  onChange={() => onChange(o)}
                  style={{ marginTop: '0.25rem' }}
                />
                <span>
                  <strong>{o.nome}</strong>
                  <br />
                  <small>
                    Contrato: {o.contrato} · {o.tipo.toUpperCase()}
                  </small>
                </span>
              </label>
            </li>
          ))}
        </ul>
      )}

      {value && (
        <p className="ok" role="status">
          OCS selecionada: {value.nome}
        </p>
      )}
    </section>
  )
}
