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
    <section className="painel painel-dados">
      <h2 className="painel-titulo">OCS</h2>
      <p className="passo-paciente-pergunta">Escolha a rede credenciada onde o exame será realizado.</p>

      <label htmlFor="busca-ocs" className="selecao-ocs-rotulo">
        Buscar OCS
      </label>
      <input
        id="busca-ocs"
        type="text"
        className="selecao-ocs-busca"
        placeholder="Digite o nome, contrato ou tipo..."
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {carregando && <p className="sf-pequeno">Carregando OCS...</p>}

      {!carregando && resultado?.erro && (
        <div className="erro" role="alert">
          <p>
            <strong>Não foi possível carregar as OCS.</strong>
          </p>
          <p>{resultado.erro}</p>
        </div>
      )}

      {!carregando && !resultado?.erro && lista.length === 0 && <p>Nenhuma OCS encontrada.</p>}

      {!carregando && !resultado?.erro && lista.length > 0 && (
        <ul className="passo-paciente-opcoes selecao-ocs-lista">
          {lista.map((o) => (
            <li key={o.id}>
              <label className={`passo-paciente-opcao${value?.id === o.id ? ' passo-paciente-opcao--marcada' : ''}`}>
                <input type="radio" name="ocs" checked={value?.id === o.id} onChange={() => onChange(o)} />
                <span>
                  <strong>{o.nome}</strong>
                  <small className="selecao-ocs-contrato">
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
