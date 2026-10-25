import { useEffect, useState } from 'react'

import { buscarProcedimentosMedico } from '../api'
import { mensagemDeErro } from '../erros'
import type { ProcedimentoBusca } from '../types'
import { useValorComDebounce } from '../useValorComDebounce'

const MINIMO_CARACTERES = 2

interface Props {
  exames: ProcedimentoBusca[]
  onAdicionar: (exame: ProcedimentoBusca) => void
  onRemover: (codigoTuss: string) => void
}

interface ResultadoBusca {
  termo: string
  dados: ProcedimentoBusca[] | null
  erro: string | null
}

export default function ExamesSecao({ exames, onAdicionar, onRemover }: Props) {
  const [busca, setBusca] = useState('')
  const termo = useValorComDebounce(busca.trim(), 300)
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null)

  const consultaAtiva = termo.length >= MINIMO_CARACTERES

  useEffect(() => {
    if (termo.length < MINIMO_CARACTERES) return undefined

    let ativo = true

    buscarProcedimentosMedico(termo)
      .then((dados) => {
        if (ativo) setResultado({ termo, dados, erro: null })
      })
      .catch((e: unknown) => {
        if (ativo) {
          setResultado({
            termo,
            dados: null,
            erro: mensagemDeErro(e, 'Não foi possível buscar os procedimentos.'),
          })
        }
      })

    return () => {
      ativo = false
    }
  }, [termo])

  const carregando = consultaAtiva && (resultado === null || resultado.termo !== termo)
  const dados = resultado?.dados ?? null

  return (
    <section className="npg-secao" aria-labelledby="npg-titulo-exames">
      <h2 id="npg-titulo-exames" className="npg-titulo">
        Exames e procedimentos
      </h2>

      <label htmlFor="npg-busca-exame" className="npg-rotulo">
        Buscar por nome ou código TUSS
      </label>
      <input
        id="npg-busca-exame"
        className="npg-input"
        placeholder="Digite o nome ou o código"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {!consultaAtiva && (
        <p className="npg-ajuda">Digite ao menos 2 caracteres para buscar.</p>
      )}

      {carregando && <p className="npg-ajuda">Buscando procedimentos...</p>}

      {consultaAtiva && !carregando && resultado?.erro && (
        <p className="erro" role="alert">
          {resultado.erro}
        </p>
      )}

      {consultaAtiva && !carregando && dados && (
        dados.length === 0 ? (
          <p className="npg-ajuda">Nenhum procedimento encontrado.</p>
        ) : (
          <ul className="npg-lista">
            {dados.map((procedimento) => {
              const incluido = exames.some(
                (exame) => exame.codigoTuss === procedimento.codigoTuss,
              )

              return (
                <li key={procedimento.codigoTuss}>
                  <button
                    type="button"
                    className="npg-item"
                    disabled={incluido}
                    onClick={() => onAdicionar(procedimento)}
                  >
                    <span className="npg-item-nome">{procedimento.nome}</span>
                    <span className="npg-item-detalhe">
                      {incluido ? 'Já incluído' : `Código TUSS: ${procedimento.codigoTuss}`}
                    </span>
                  </button>
                </li>
              )
            })}
          </ul>
        )
      )}

      {exames.length > 0 && (
        <table className="npg-tabela">
          <thead>
          <tr>
            <th>Código TUSS</th>
            <th>Procedimento</th>
            <th></th>
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
                  className="npg-botao-secundario"
                  onClick={() => onRemover(exame.codigoTuss)}
                >
                  Remover
                </button>
              </td>
            </tr>
          ))}
          </tbody>
        </table>
      )}

      <p className="npg-rodape">Inclua ao menos um exame.</p>
    </section>
  )
}
