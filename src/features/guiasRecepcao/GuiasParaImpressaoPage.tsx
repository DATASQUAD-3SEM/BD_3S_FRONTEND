import { useRef, useState, type FormEvent } from 'react'
import { guiasRecepcaoApi } from './api'
import { formatarData, formatarPrecCp } from '../../shared/utils/formatadores'
import { imprimirUrlEmSegundoPlano } from './imprimirPdf'
import VisualizarGuiaModal from './VisualizarGuiaModal'
import type { GuiaRecepcao, GuiasRecepcaoApi } from './types'
import './guiasRecepcao.css'

/**
 * Tela 6 - Guias para impressao da Recepcao (T6-FE): busca por nome, Prec CP ou numero da Guia
 * e acoes de visualizar e imprimir. So aparecem Guias concluidas, com as duas assinaturas.
 */

const MINIMO_CARACTERES = 3

type Estado = 'inicial' | 'carregando' | 'pronto' | 'vazio' | 'erro'

interface Props {
  api?: GuiasRecepcaoApi
}

export default function GuiasParaImpressaoPage({ api = guiasRecepcaoApi }: Props) {
  const [digitado, setDigitado] = useState('')
  const [termoBuscado, setTermoBuscado] = useState('')
  const [estado, setEstado] = useState<Estado>('inicial')
  const [resultados, setResultados] = useState<GuiaRecepcao[]>([])
  const [validacao, setValidacao] = useState<string | null>(null)
  const [acaoErro, setAcaoErro] = useState<string | null>(null)
  const [guiaAberta, setGuiaAberta] = useState<GuiaRecepcao | null>(null)
  const botaoAbertoRef = useRef<HTMLButtonElement | null>(null)
  const requisicao = useRef(0)

  async function buscar(termo: string) {
    const numero = ++requisicao.current
    setTermoBuscado(termo)
    setEstado('carregando')
    setAcaoErro(null)
    try {
      const dados = await api.buscar(termo)
      if (numero !== requisicao.current) return
      setResultados(dados)
      setEstado(dados.length > 0 ? 'pronto' : 'vazio')
    } catch {
      if (numero !== requisicao.current) return
      setEstado('erro')
    }
  }

  function aoEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const termo = digitado.trim()
    if (termo.length < MINIMO_CARACTERES) {
      setValidacao(`Digite pelo menos ${MINIMO_CARACTERES} caracteres para buscar.`)
      return
    }
    setValidacao(null)
    void buscar(termo)
  }

  function abrirVisualizacao(guia: GuiaRecepcao, botao: HTMLButtonElement) {
    botaoAbertoRef.current = botao
    setGuiaAberta(guia)
  }

  function fecharVisualizacao() {
    setGuiaAberta(null)
    botaoAbertoRef.current?.focus()
  }

  async function imprimirDaLista(guia: GuiaRecepcao) {
    setAcaoErro(null)
    try {
      const pdf = await api.obterPdf(guia.guiaId, 'imprimir')
      imprimirUrlEmSegundoPlano(URL.createObjectURL(pdf))
    } catch {
      setAcaoErro('Não foi possível imprimir a Guia. Tente novamente.')
    }
  }

  return (
    <section className="guias-recepcao">
      <h1>Guias para impressão</h1>

      <div className="guias-recepcao__painel">
        <form role="search" className="guias-recepcao__busca" onSubmit={aoEnviar}>
          <label htmlFor="busca-guia">Nome do beneficiário, Prec CP ou número da Guia</label>
          <div className="guias-recepcao__campo">
            <input
              id="busca-guia"
              type="search"
              value={digitado}
              onChange={(e) => setDigitado(e.target.value)}
              aria-describedby="nota-busca-guia"
            />
            <button type="submit" className="botao botao-primario">
              Buscar
            </button>
          </div>
          {validacao && (
            <p role="alert" className="guias-recepcao__validacao">
              {validacao}
            </p>
          )}
          <p id="nota-busca-guia" className="guias-recepcao__nota">
            Aparecem apenas Guias Concluídas, com as duas assinaturas.
          </p>
        </form>
      </div>

      <div className="guias-recepcao__painel">
        {estado === 'inicial' && <p className="estado-vazio">Digite para buscar uma Guia</p>}

        {estado === 'carregando' && (
          <div data-testid="skeleton" aria-busy="true" aria-label="Buscando Guias">
            {[1, 2, 3].map((n) => (
              <div key={n} className="skeleton-linha" />
            ))}
          </div>
        )}

        {estado === 'erro' && (
          <div role="alert" className="estado-erro">
            <p>Não foi possível buscar as Guias.</p>
            <button
              type="button"
              className="botao botao-primario"
              onClick={() => void buscar(termoBuscado)}
            >
              Tentar novamente
            </button>
          </div>
        )}

        {estado === 'vazio' && <p className="estado-vazio">Nenhuma Guia encontrada</p>}

        {estado === 'pronto' && (
          <div className="guias-recepcao__tabela-wrapper">
            <table className="guias-recepcao__tabela">
              <thead>
              <tr>
                <th>Guia</th>
                <th>Beneficiário</th>
                <th>Prec CP</th>
                <th>OCS</th>
                <th>Válida até</th>
                <th>
                  <span className="sr-only">Ações</span>
                </th>
              </tr>
              </thead>
              <tbody>
              {resultados.map((g) => (
                <tr key={g.guiaId}>
                  <td>{g.numero}</td>
                  <td>{g.beneficiarioNome}</td>
                  <td>{formatarPrecCp(g.precCp)}</td>
                  <td>{g.ocsNome}</td>
                  <td>{formatarData(g.validadeAte)}</td>
                  <td>
                    <div className="guias-recepcao__acoes">
                      <button
                        type="button"
                        className="botao"
                        onClick={(e) => abrirVisualizacao(g, e.currentTarget)}
                      >
                        Visualizar
                      </button>
                      <button
                        type="button"
                        className="botao botao-primario"
                        onClick={() => void imprimirDaLista(g)}
                      >
                        Imprimir
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              </tbody>
            </table>
          </div>
        )}

        {acaoErro && (
          <p role="alert" className="estado-erro">
            {acaoErro}
          </p>
        )}
      </div>

      {guiaAberta && (
        <VisualizarGuiaModal guia={guiaAberta} api={api} onFechar={fecharVisualizacao} />
      )}
    </section>
  )
}
