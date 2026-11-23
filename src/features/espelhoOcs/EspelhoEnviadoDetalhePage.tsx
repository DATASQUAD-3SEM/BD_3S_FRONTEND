import { Fragment, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import VisualizadorPdf from './VisualizadorPdf'
import { espelhoApi } from './api'
import { formatarMoeda } from './formatadores'
import { encontrarEspelhoEnviado, formatarPeriodo } from './historico'
import { agruparPorGuia } from './modeloEspelho'
import type { Espelho } from './types'
import './espelhoEmConstrucao.css'
import './historico.css'

type Estado = 'carregando' | 'pronto' | 'nao-encontrado' | 'erro'

export default function EspelhoEnviadoDetalhePage() {
  const { id } = useParams()
  const espelhoId = Number(id)
  const [estado, setEstado] = useState<Estado>('carregando')
  const [espelho, setEspelho] = useState<Espelho | null>(null)
  const [pdfAbertos, setPdfAbertos] = useState<number[]>([])
  const [tentativa, setTentativa] = useState(0)

  useEffect(() => {
    let cancelado = false
    espelhoApi
      .listarHistorico()
      .then((lista) => {
        if (cancelado) return
        const encontrado = encontrarEspelhoEnviado(lista, espelhoId)
        setEspelho(encontrado)
        setEstado(encontrado ? 'pronto' : 'nao-encontrado')
      })
      .catch(() => {
        if (cancelado) return
        setEstado('erro')
      })
    return () => {
      cancelado = true
    }
  }, [espelhoId, tentativa])

  function tentarNovamente() {
    setEstado('carregando')
    setTentativa((n) => n + 1)
  }

  function alternarPdf(guiaId: number) {
    setPdfAbertos((atuais) =>
      atuais.includes(guiaId) ? atuais.filter((id) => id !== guiaId) : [...atuais, guiaId],
    )
  }

  const grupos = espelho ? agruparPorGuia(espelho.itens) : []

  return (
    <section className="eh-pagina">
      <div>
        <Link className="botao" to="/ocs/espelho">
          ← Espelho
        </Link>
      </div>

      {estado === 'carregando' && <p aria-busy="true">Carregando espelho…</p>}

      {estado === 'nao-encontrado' && <p>Espelho não encontrado.</p>}

      {estado === 'erro' && (
        <div role="alert" className="estado-erro">
          <p>Não foi possível carregar o espelho.</p>
          <button type="button" className="botao botao-primario" onClick={tentarNovamente}>
            Tentar novamente
          </button>
        </div>
      )}

      {estado === 'pronto' && espelho && (
        <>
          <h1>{`Espelho nº ${espelho.id}`}</h1>
          <p className="eh-subtitulo">{`Período: ${formatarPeriodo(espelho.dataInicio, espelho.dataEnvio)}`}</p>

          <table className="ee-tabela">
            <thead>
            <tr>
              <th scope="col">Guia nº</th>
              <th scope="col">Código</th>
              <th scope="col">Procedimento</th>
              <th scope="col">Sessões</th>
              <th scope="col">Valor por sessão</th>
              <th scope="col">Valor total</th>
            </tr>
            </thead>
            <tbody>
            {grupos.map((grupo) => (
              <Fragment key={grupo.guiaId}>
                {grupo.itens.map((item) => (
                  <tr key={`${grupo.guiaId}-${item.codDgp}`}>
                    <td>
                      <span>{grupo.numeroGuia}</span>
                      <button
                        type="button"
                        className="botao eh-botao-pdf"
                        aria-expanded={pdfAbertos.includes(grupo.guiaId)}
                        onClick={() => alternarPdf(grupo.guiaId)}
                      >
                        Ver guia (PDF)
                      </button>
                    </td>
                    <td>{item.codDgp}</td>
                    <td>{item.descricao}</td>
                    <td>{item.quantidadeSessoes}</td>
                    <td>{formatarMoeda(item.valorSessao)}</td>
                    <td>{formatarMoeda(item.valorTotal)}</td>
                  </tr>
                ))}
                {pdfAbertos.includes(grupo.guiaId) && (
                  <tr>
                    <td colSpan={6}>
                      <VisualizadorPdf
                        guiaId={grupo.guiaId}
                        numero={grupo.numeroGuia}
                        onFechar={() => alternarPdf(grupo.guiaId)}
                      />
                    </td>
                  </tr>
                )}
              </Fragment>
            ))}
            </tbody>
          </table>

          <footer className="ee-rodape">
            <span>VALOR TOTAL</span>
            <strong>{formatarMoeda(espelho.valorTotal)}</strong>
          </footer>
        </>
      )}
    </section>
  )
}
