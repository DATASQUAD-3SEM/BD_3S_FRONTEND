import { useEffect, useState } from 'react'

import { buscarOcsMedico } from '../api'
import { mensagemDeErro } from '../erros'
import { rotuloTipo } from '../formatadores'
import type { OcsBusca, OcsBuscaResposta } from '../types'
import { useValorComDebounce } from '../useValorComDebounce'

interface Props {
  selecionada: OcsBusca | null
  onSelecionar: (ocs: OcsBusca) => void
  onTrocar: () => void
}

interface ResultadoBusca {
  termo: string
  dados: OcsBuscaResposta | null
  erro: string | null
}

export default function OcsSecao({ selecionada, onSelecionar, onTrocar }: Props) {
  const [busca, setBusca] = useState('')
  const termo = useValorComDebounce(busca.trim(), 300)
  const [resultado, setResultado] = useState<ResultadoBusca | null>(null)

  useEffect(() => {
    let ativo = true

    buscarOcsMedico(termo)
      .then((dados) => {
        if (ativo) setResultado({ termo, dados, erro: null })
      })
      .catch((e: unknown) => {
        if (ativo) {
          setResultado({
            termo,
            dados: null,
            erro: mensagemDeErro(e, 'Não foi possível buscar as OCS.'),
          })
        }
      })

    return () => {
      ativo = false
    }
  }, [termo])

  // Carregando enquanto o resultado ainda não corresponde ao termo atual.
  const carregando = resultado === null || resultado.termo !== termo

  if (selecionada) {
    return (
      <section className="npg-secao" aria-labelledby="npg-titulo-ocs">
        <h2 id="npg-titulo-ocs" className="npg-titulo">
          OCS
        </h2>

        <div className="npg-faixa-selecionada" role="status">
          <span>
            OCS selecionada · {selecionada.nome} · {selecionada.contrato} ·{' '}
            {rotuloTipo(selecionada.tipo)}
          </span>
          <button type="button" className="npg-botao-secundario" onClick={onTrocar}>
            Trocar
          </button>
        </div>
      </section>
    )
  }

  const dados = resultado?.dados ?? null

  return (
    <section className="npg-secao" aria-labelledby="npg-titulo-ocs">
      <h2 id="npg-titulo-ocs" className="npg-titulo">
        OCS
      </h2>

      <p className="npg-aviso">Nenhuma OCS selecionada. Escolha uma das opções da lista.</p>

      <label htmlFor="npg-busca-ocs" className="npg-rotulo">
        Buscar OCS
      </label>
      <input
        id="npg-busca-ocs"
        className="npg-input"
        placeholder="Digite o nome, o contrato ou o tipo da OCS"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
      />

      {carregando && <p className="npg-ajuda">Buscando OCS...</p>}

      {!carregando && resultado?.erro && (
        <p className="erro" role="alert">
          {resultado.erro}
        </p>
      )}

      {!carregando && dados && (
        dados.resultados.length === 0 ? (
          <p className="npg-ajuda">Nenhuma OCS encontrada.</p>
        ) : (
          <>
            <ul className="npg-lista">
              {dados.resultados.map((ocs) => (
                <li key={ocs.id}>
                  <button
                    type="button"
                    className="npg-item"
                    onClick={() => onSelecionar(ocs)}
                  >
                    <span className="npg-item-nome">{ocs.nome}</span>
                    <span className="npg-item-detalhe">
                      Contrato: {ocs.contrato} · {rotuloTipo(ocs.tipo)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>

            {dados.total > dados.resultados.length && (
              <p className="npg-rodape">
                Mostrando {dados.resultados.length} de {dados.total} resultados. Refine a
                busca para ver outros.
              </p>
            )}
          </>
        )
      )}
    </section>
  )
}
