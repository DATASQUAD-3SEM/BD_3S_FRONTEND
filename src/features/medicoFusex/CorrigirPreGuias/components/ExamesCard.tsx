import { useEffect, useState } from 'react'
import type { CorrecaoApi, ProcedimentoResumo } from '../correcaoTipos'
import { mensagemDeErro } from '../../../../shared/api/erros'
import { useDebounce } from '../../../../shared/hooks/useDebounce'

interface Props {
  exames: ProcedimentoResumo[]
  api: CorrecaoApi
  onAdicionar: (procedimento: ProcedimentoResumo) => void
  onRemover: (codigoTuss: string) => void
}

interface Resultado {
  termo: string
  itens: ProcedimentoResumo[]
  erro: string | null
}

export default function ExamesCard({ exames, api, onAdicionar, onRemover }: Props) {
  const [busca, setBusca] = useState('')
  const termo = useDebounce(busca.trim(), 300)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  useEffect(() => {
    if (termo.length < 2) return
    let ativo = true
    api
      .buscarProcedimentos(termo)
      .then((itens) => {
        if (ativo) setResultado({ termo, itens, erro: null })
      })
      .catch((erro) => {
        if (ativo)
          setResultado({
            termo,
            itens: [],
            erro: mensagemDeErro(erro, 'Não foi possível buscar os procedimentos.'),
          })
      })
    return () => {
      ativo = false
    }
  }, [api, termo])

  const buscando = termo.length >= 2 && (resultado === null || resultado.termo !== termo)
  const ultimoExame = exames.length <= 1

  function renderBusca() {
    if (busca.trim().length < 2) return <p className="pgd__ajuda">Digite ao menos 2 caracteres para buscar.</p>
    if (buscando) return <p className="pgd__ajuda">Buscando procedimentos...</p>
    if (!resultado) return null
    if (resultado.erro) return <p role="alert" className="pgd__erro">{resultado.erro}</p>
    if (resultado.itens.length === 0) return <p className="pgd__ajuda">Nenhum procedimento encontrado.</p>
    return (
      <ul className="pgd__lista">
        {resultado.itens.map((item) => {
          const jaIncluido = exames.some((e) => e.codigoTuss === item.codigoTuss)
          return (
            <li key={item.codigoTuss}>
              <button
                type="button"
                className="pgd__item"
                disabled={jaIncluido}
                onClick={() => onAdicionar(item)}
              >
                <strong>{item.nome}</strong>
                <span>{jaIncluido ? 'Já incluído' : `Código TUSS: ${item.codigoTuss}`}</span>
              </button>
            </li>
          )
        })}
      </ul>
    )
  }

  return (
    <section className="pgd__cartao" aria-labelledby="pgd-exames">
      <h2 id="pgd-exames">Exames e procedimentos</h2>
      <label htmlFor="pgd-busca-exame" className="pgd__rotulo">
        Buscar por nome ou código TUSS
      </label>
      <input
        id="pgd-busca-exame"
        className="pgd__campo"
        type="search"
        placeholder="Digite o nome ou o código"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />
      {renderBusca()}

      <table className="pgd__tabela">
        <thead>
        <tr>
          <th>Código TUSS</th>
          <th>Procedimento</th>
          <th>
            <span className="sr-only">Ações</span>
          </th>
        </tr>
        </thead>
        <tbody>
        {exames.map((exame) => (
          <tr key={exame.codigoTuss}>
            <td>{exame.codigoTuss}</td>
            <td>{exame.nome}</td>
            <td>
              <button
                type="button"
                className="botao"
                disabled={ultimoExame}
                title={ultimoExame ? 'Mantenha ao menos um exame.' : undefined}
                onClick={() => onRemover(exame.codigoTuss)}
              >
                Remover
              </button>
            </td>
          </tr>
        ))}
        </tbody>
      </table>
      <p className="pgd__ajuda">Mantenha ao menos um exame.</p>
    </section>
  )
}
