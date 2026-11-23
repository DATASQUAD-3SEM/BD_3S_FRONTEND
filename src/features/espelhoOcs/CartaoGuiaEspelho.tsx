import { useState } from 'react'
import VisualizadorPdf from './VisualizadorPdf'
import { mensagemDeErro } from '../../shared/api/erros'
import { formatarMoeda, montarValores, valoresPreenchidos } from './formatadores'
import { valoresIniciais, type GrupoGuiaEspelho } from './modeloEspelho'
import type { ValorProcedimento } from './types'

interface Props {
  grupo: GrupoGuiaEspelho
  selecionada: boolean
  editando: boolean
  onAlternarSelecao: () => void
  onCancelarEdicao: () => void
  onSalvarValores: (valores: ValorProcedimento[]) => Promise<void>
}

export default function CartaoGuiaEspelho({
                                            grupo,
                                            selecionada,
                                            editando,
                                            onAlternarSelecao,
                                            onCancelarEdicao,
                                            onSalvarValores,
                                          }: Props) {
  const [pdfAberto, setPdfAberto] = useState(false)
  const [editados, setEditados] = useState<Record<string, string> | null>(null)
  const [salvando, setSalvando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  const valores = editados ?? valoresIniciais(grupo.itens)
  const completo = valoresPreenchidos(grupo.itens, valores)

  function alternarSelecao() {
    setEditados(null)
    onAlternarSelecao()
  }

  function alterar(codDgp: string, texto: string) {
    setEditados({ ...valores, [codDgp]: texto })
  }

  function cancelar() {
    setEditados(null)
    setErro(null)
    onCancelarEdicao()
  }

  async function salvar() {
    setErro(null)
    setSalvando(true)
    try {
      await onSalvarValores(montarValores(grupo.itens, valores))
      setEditados(null)
    } catch (falha) {
      setErro(mensagemDeErro(falha, 'Não foi possível salvar os valores.'))
    } finally {
      setSalvando(false)
    }
  }

  return (
    <article className="ee-cartao">
      <header className="ee-cartao-cabecalho">
        <label className="ee-selecao">
          <input type="checkbox" checked={selecionada} onChange={alternarSelecao} />
          <span>{`Guia nº ${grupo.numeroGuia}`}</span>
        </label>
        <button
          type="button"
          className="botao"
          aria-expanded={pdfAberto}
          onClick={() => setPdfAberto((aberto) => !aberto)}
        >
          Ver guia (PDF)
        </button>
      </header>

      <p className="ee-paciente">{grupo.paciente}</p>

      <table className="ee-tabela">
        <thead>
        <tr>
          <th scope="col">Código</th>
          <th scope="col">Procedimento</th>
          <th scope="col">Sessões</th>
          <th scope="col">Valor por sessão</th>
          <th scope="col">Valor total</th>
        </tr>
        </thead>
        <tbody>
        {grupo.itens.map((item) => (
          <tr key={item.codDgp}>
            <td>{item.codDgp}</td>
            <td>{item.descricao}</td>
            <td>{item.quantidadeSessoes}</td>
            <td>{formatarMoeda(item.valorSessao)}</td>
            <td>{formatarMoeda(item.valorTotal)}</td>
          </tr>
        ))}
        </tbody>
      </table>

      {editando && (
        <div className="ee-edicao">
          <ul>
            {grupo.itens.map((item) => (
              <li key={item.codDgp}>
                <span>{`${item.codDgp} · ${item.descricao} · ${item.quantidadeSessoes} sessões`}</span>
                <input
                  type="text"
                  inputMode="decimal"
                  aria-label={`Valor por sessão de ${item.codDgp}`}
                  value={valores[item.codDgp] ?? ''}
                  disabled={salvando}
                  onChange={(evento) => alterar(item.codDgp, evento.target.value)}
                />
              </li>
            ))}
          </ul>
          {erro && (
            <p role="alert" className="estado-erro">
              {erro}
            </p>
          )}
          <div className="ee-acoes">
            <button
              type="button"
              className="botao botao-primario"
              disabled={!completo || salvando}
              onClick={() => void salvar()}
            >
              {salvando ? 'Salvando…' : 'Salvar'}
            </button>
            <button type="button" className="botao" disabled={salvando} onClick={cancelar}>
              Cancelar
            </button>
          </div>
        </div>
      )}

      {pdfAberto && (
        <VisualizadorPdf guiaId={grupo.guiaId} numero={grupo.numeroGuia} onFechar={() => setPdfAberto(false)} />
      )}
    </article>
  )
}
