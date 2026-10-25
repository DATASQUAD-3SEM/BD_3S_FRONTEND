import { useEffect, useState } from 'react'
import type { CorrecaoApi, OcsResumo } from '../correcaoTipos'
import { mensagemDeErro } from '../../../../shared/api/erros'
import { useDebounce } from '../../../../shared/hooks/useDebounce'

/**
 * Cartao "OCS" da correcao do medico (T14-FE2): a OCS atual ja vem selecionada e pode ser trocada pela busca.
 */

interface Props {
  selecionada: OcsResumo
  api: CorrecaoApi
  onSelecionar: (ocs: OcsResumo) => void
}

interface Resultado {
  termo: string
  itens: OcsResumo[]
  total: number
  erro: string | null
}

export default function OcsCard({ selecionada, api, onSelecionar }: Props) {
  const [busca, setBusca] = useState('')
  const [trocando, setTrocando] = useState(false)
  const termo = useDebounce(busca.trim(), 300)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const mostrarLista = trocando || busca.trim() !== ''

  useEffect(() => {
    if (!mostrarLista) return
    let ativo = true
    api
      .buscarOcs(termo)
      .then((r) => {
        if (ativo) setResultado({ termo, itens: r.resultados, total: r.total, erro: null })
      })
      .catch((erro) => {
        if (ativo)
          setResultado({
            termo,
            itens: [],
            total: 0,
            erro: mensagemDeErro(erro, 'Não foi possível buscar as OCS.'),
          })
      })
    return () => {
      ativo = false
    }
  }, [api, termo, mostrarLista])

  const carregando = mostrarLista && (resultado === null || resultado.termo !== termo)

  function escolher(ocs: OcsResumo) {
    onSelecionar(ocs)
    setTrocando(false)
    setBusca('')
  }

  function renderLista() {
    if (!mostrarLista) return null
    if (carregando) return <p className="pgd__ajuda">Buscando OCS...</p>
    if (!resultado) return null
    if (resultado.erro) return <p role="alert" className="pgd__erro">{resultado.erro}</p>
    if (resultado.itens.length === 0) return <p className="pgd__ajuda">Nenhuma OCS encontrada.</p>
    return (
      <>
        <ul className="pgd__lista">
          {resultado.itens.map((item) => (
            <li key={item.id}>
              <button type="button" className="pgd__item" onClick={() => escolher(item)}>
                <strong>{item.nome}</strong>
                <span>
                  Contrato: {item.contrato} · {item.tipo.toUpperCase()}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {resultado.total > resultado.itens.length && (
          <p className="pgd__ajuda">
            Mostrando {resultado.itens.length} de {resultado.total} resultados. Refine a busca para ver outros.
          </p>
        )}
      </>
    )
  }

  return (
    <section className="pgd__cartao" aria-labelledby="pgd-ocs">
      <h2 id="pgd-ocs">OCS</h2>
      <label htmlFor="pgd-busca-ocs" className="pgd__rotulo">
        Buscar OCS
      </label>
      <input
        id="pgd-busca-ocs"
        className="pgd__campo"
        type="search"
        placeholder="Digite o nome, o contrato ou o tipo da OCS"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
      {renderLista()}

      <div className="pgd__faixa" role="status">
        <span>
          OCS selecionada · {selecionada.nome} · {selecionada.contrato} · {selecionada.tipo.toUpperCase()}
        </span>
        <button type="button" className="botao" onClick={() => setTrocando(true)}>
          Trocar
        </button>
      </div>
    </section>
  )
}
