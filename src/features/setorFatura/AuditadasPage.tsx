import { useEffect, useState } from 'react'
import { setorFaturasApi } from './api'
import { formatarDataCurta, formatarMoeda } from './formatadores'
import type { FaturaAuditada, SetorFaturasApi } from './types'
import './setorFatura.css'

interface Props {
  api?: SetorFaturasApi
}

type Carga = 'carregando' | 'pronto' | 'erro'

/**
 * Aba "Faturas Auditadas" do Setor de Faturas (T24-FE4): faturas que já passaram pela auditoria, só leitura.
 * Mostra OCS, nº da fatura, datas, valores informado, glosa e final, e a data em que a auditoria visualizou.
 */
export default function AuditadasPage({ api = setorFaturasApi }: Props) {
  const [faturas, setFaturas] = useState<FaturaAuditada[]>([])
  const [carga, setCarga] = useState<Carga>('carregando')

  useEffect(() => {
    let ativo = true
    api
      .listarAuditadas()
      .then((dados) => {
        if (!ativo) return
        setFaturas(dados)
        setCarga('pronto')
      })
      .catch(() => {
        if (ativo) setCarga('erro')
      })
    return () => {
      ativo = false
    }
  }, [api])

  return (
    <section className="sf">
      <header className="sf-cabecalho">
        <h1>Faturas Auditadas</h1>
        <p className="sf-subtitulo">Faturas que a auditoria concluiu. Somente consulta.</p>
      </header>

      {carga === 'carregando' && (
        <div className="sf-vazio" role="status">
          Carregando faturas auditadas…
        </div>
      )}

      {carga === 'erro' && (
        <div className="sf-vazio sf-vazio--erro" role="alert">
          Não foi possível carregar as faturas auditadas.
        </div>
      )}

      {carga === 'pronto' && faturas.length === 0 && <div className="sf-vazio">Nenhuma fatura auditada ainda.</div>}

      {carga === 'pronto' && faturas.length > 0 && (
        <div className="sf-tabela-wrapper">
          <table className="sf-tabela">
            <thead>
              <tr>
                <th scope="col">OCS/PSA</th>
                <th scope="col">Nº da fatura</th>
                <th scope="col">Data de envio</th>
                <th scope="col">Visualizada pela auditoria</th>
                <th scope="col">Valor informado</th>
                <th scope="col">Glosa</th>
                <th scope="col">Valor final</th>
              </tr>
            </thead>
            <tbody>
              {faturas.map((f) => (
                <tr key={f.id}>
                  <td>{f.ocs}</td>
                  <td>{f.numeroFatura ?? '—'}</td>
                  <td>{formatarDataCurta(f.dataEnvio)}</td>
                  <td>{f.dataVisualizacao ? formatarDataCurta(f.dataVisualizacao) : '—'}</td>
                  <td>{formatarMoeda(f.valorInformado)}</td>
                  <td>{formatarMoeda(f.valorGlosa)}</td>
                  <td>{formatarMoeda(f.valorFinal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
