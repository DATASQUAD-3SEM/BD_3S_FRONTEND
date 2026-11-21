import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import type { FaturaLisuraDetalhe, LinhaLisura } from '../rastreabilidade/types'
import VisualizadorPdf from '../espelhoOcs/VisualizadorPdf'
import ControleFluxoFatura from '../setorFatura/components/ControleFluxoFatura'
import SeloSituacao from '../setorFatura/components/SeloSituacao'
import { formatarDataCurta, formatarMoeda } from '../setorFatura/formatadores'
import '../setorFatura/setorFatura.css'
import { auditoriaApi } from './api'
import type { AndamentoGlosa, AuditoriaApi, FaturaAuditoriaDetalhe } from './types'

interface Props {
  api?: AuditoriaApi
}

type Carga = 'carregando' | 'pronto' | 'erro'

const ROTULO_ORIGEM: Record<NonNullable<LinhaLisura['origemContrato']>, string> = {
  TABELA: 'Tabela',
  TABELA_CORRIGIDA: 'Tabela (corrigida)',
  CONFERIDO: 'Conferido',
  MANUAL: 'Manual',
}

/**
 * Visualização da fatura pela auditoria (T26-FE2): só leitura. Mostra o que a lisura e, se houve glosa, a OCS
 * decidiram. Sem campos editáveis e sem botão de decisão. O botão "Marcar como visualizada" é a T26-FE3.
 */
export default function AuditoriaFaturaPage({ api = auditoriaApi }: Props) {
  const { id } = useParams()
  const faturaId = Number(id)
  const [fatura, setFatura] = useState<FaturaAuditoriaDetalhe | null>(null)
  const [carga, setCarga] = useState<Carga>('carregando')
  const [pdf, setPdf] = useState<{ guiaId: number; numero: string } | null>(null)
  const navegar = useNavigate()
  const [painelAberto, setPainelAberto] = useState(false)
  const [responsavel, setResponsavel] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    let ativo = true
    api
      .detalhar(faturaId)
      .then((dados) => {
        if (!ativo) return
        setFatura(dados)
        setCarga('pronto')
      })
      .catch(() => {
        if (ativo) setCarga('erro')
      })
    return () => {
      ativo = false
    }
  }, [api, faturaId])

  const resumo = useMemo(() => {
    if (!fatura) return null
    const glosa = fatura.linhas.reduce((soma, l) => soma + (l.glosa ?? 0), 0)
    const final = fatura.linhas.reduce((soma, l) => soma + (l.valorContrato ?? l.valorSessao) * l.quantidadeSessoes, 0)
    return { informado: fatura.totais.informado, glosa: round2(glosa), final: round2(final) }
  }, [fatura])

  if (carga === 'carregando') {
    return (
      <section className="sf">
        <div className="sf-vazio" role="status">
          Carregando a fatura…
        </div>
      </section>
    )
  }
  if (carga === 'erro' || !fatura || !resumo) {
    return (
      <section className="sf">
        <div className="sf-vazio sf-vazio--erro" role="alert">
          Não foi possível carregar a fatura.
        </div>
      </section>
    )
  }

  const temGlosa = resumo.glosa !== 0

  async function confirmarVisualizacao() {
    const nome = responsavel.trim()
    if (nome.length < 3 || nome.length > 100) {
      setErro('Informe o seu nome (3 a 100 caracteres).')
      return
    }
    setEnviando(true)
    setErro(null)
    try {
      await api.visualizar(faturaId, nome)
      navegar('/auditoria/faturas-recebidas')
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Não foi possível marcar a fatura como visualizada.')
      setEnviando(false)
    }
  }

  return (
    <section className="sf">
      <Link to="/auditoria/faturas-recebidas" className="sf-voltar">
        ← Faturas recebidas
      </Link>

      <header className="sf-cabecalho">
        <h1>Fatura nº {fatura.numeroFatura ?? '—'}</h1>
        <p className="sf-subtitulo">
          {fatura.ocs} · Entrada em {formatarDataCurta(fatura.dataEntrada)} <SeloSituacao situacao={fatura.situacao} />
        </p>
        {temGlosa && <FaixaGlosaOcs fatura={fatura} />}
      </header>

      <div className="sf-resumo">
        <div>
          <span>Valor informado pela OCS</span>
          <strong>{formatarMoeda(resumo.informado)}</strong>
        </div>
        <div>
          <span>
            Glosa
            {resumo.glosa > 0 ? ' (cobrado a mais)' : resumo.glosa < 0 ? ' (cobrado a menos)' : ''}
          </span>
          <strong>{formatarMoeda(resumo.glosa)}</strong>
        </div>
        <div>
          <span>Valor final após lisura</span>
          <strong>{formatarMoeda(resumo.final)}</strong>
        </div>
        <div>
          <span>Período</span>
          <strong>
            {formatarDataCurta(fatura.dataInicio)} a {formatarDataCurta(fatura.dataEnvio)}
          </strong>
        </div>
      </div>

      <div className="sf-tabela-wrapper">
        <table className="sf-tabela">
          <thead>
            <tr>
              <th scope="col">Guia · Paciente</th>
              <th scope="col">Procedimento</th>
              <th scope="col">Qtd.</th>
              <th scope="col">Informado (R$/sessão)</th>
              <th scope="col">Contrato (R$/sessão)</th>
              <th scope="col">Origem</th>
              <th scope="col">Glosa (R$)</th>
              <th scope="col">Conferência</th>
              <th scope="col">Observação</th>
            </tr>
          </thead>
          <tbody>
            {fatura.linhas.map((linha) => {
              const glosa = linha.glosa ?? 0
              return (
                <tr key={linha.itemId}>
                  <td>
                    {linha.guiaNumero} · {linha.paciente}
                    <div>
                      <button type="button" className="sf-link" onClick={() => setPdf({ guiaId: linha.guiaId, numero: linha.guiaNumero })}>
                        Ver guia (PDF)
                      </button>
                    </div>
                  </td>
                  <td>
                    {linha.codigo} · {linha.procedimento}
                  </td>
                  <td>{linha.quantidadeSessoes}</td>
                  <td>{formatarMoeda(linha.valorSessao)}</td>
                  <td>{linha.valorContrato == null ? '—' : formatarMoeda(linha.valorContrato)}</td>
                  <td>{linha.origemContrato ? ROTULO_ORIGEM[linha.origemContrato] : '—'}</td>
                  <td>{glosa === 0 ? '—' : formatarMoeda(glosa)}</td>
                  <td>
                    {glosa === 0 ? 'Sem glosa' : 'Glosada'}
                    <span className="sf-pequeno"> · {textoComparacao(linha.comparacao)}</span>
                  </td>
                  <td>{linha.observacao ?? '—'}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {(fatura.andamentoGlosa ?? []).map((andamento) => (
        <AndamentoDaGuia key={andamento.guiaId} andamento={andamento} />
      ))}
      {fatura.situacao === 'EM_AUDITORIA' && (
        <div className="sf-acoes">
          <button type="button" className="sf-botao" onClick={() => setPainelAberto(true)}>
            Marcar como visualizada
          </button>
        </div>
      )}

      {painelAberto && (
        <div className="sf-painel" role="dialog" aria-label="Confirmar visualização">
          <h3>Confirmar visualização</h3>
          <p>
            Marcar a fatura nº {fatura.numeroFatura ?? '—'} como visualizada? Ela volta para o setor de Faturas como
            concluída e encerra o fluxo no Nexus.
          </p>
          <label>
            Responsável (seu nome)
            <input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} maxLength={100} />
          </label>
          {erro && (
            <p className="sf-erro" role="alert">
              {erro}
            </p>
          )}
          <div className="sf-acoes">
            <button
              type="button"
              className="sf-botao"
              disabled={enviando || responsavel.trim().length < 3}
              onClick={confirmarVisualizacao}
            >
              Sim, marcar como visualizada
            </button>
            <button
              type="button"
              className="sf-botao sf-botao--secundario"
              onClick={() => setPainelAberto(false)}
              disabled={enviando}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      <ControleFluxoFatura etapas={fatura.controleFluxo} />

      {pdf && (
        <VisualizadorPdf
          guiaId={pdf.guiaId}
          numero={pdf.numero}
          onFechar={() => setPdf(null)}
          obterPdf={() => api.obterPdfGuia(pdf.guiaId)}
        />
      )}
    </section>
  )
}

/** Faixa da decisão da OCS, referente ao envio mais recente (só quando houve glosa). */
function FaixaGlosaOcs({ fatura }: { fatura: FaturaLisuraDetalhe }) {
  if (fatura.dataCiencia) {
    const responsavel = fatura.responsavelCiencia ? ` (${fatura.responsavelCiencia})` : ''
    return (
      <p className="sf-faixa sf-faixa--ok" role="status">
        A OCS deu ciência das glosas em {formatarDataCurta(fatura.dataCiencia)}
        {responsavel}.
      </p>
    )
  }
  if (fatura.prazoOcs && prazoVencido(fatura.prazoOcs)) {
    return (
      <p className="sf-faixa sf-faixa--alerta" role="status">
        Prazo de 3 dias úteis vencido em {formatarDataCurta(fatura.prazoOcs)}, sem decisão da OCS.
      </p>
    )
  }
  return null
}

/** Andamento da glosa de uma Guia que foi à OCS (regra 13.2): selo final e os itens em ordem de data. */
function AndamentoDaGuia({ andamento }: { andamento: AndamentoGlosa }) {
  return (
    <section className="sf-andamento" aria-label={`Andamento da glosa · Guia nº ${andamento.guiaNumero}`}>
      <h2>
        Andamento da glosa · Guia nº {andamento.guiaNumero} <span className="sf-selo">{andamento.seloFinal}</span>
      </h2>
      <ol>
        {andamento.itens.map((item, indice) => (
          <li key={indice}>
            <strong>{formatarDataCurta(item.data)}</strong> — {item.texto}
          </li>
        ))}
      </ol>
    </section>
  )
}

/** O prazo da OCS (23:59:59 do 3º dia útil) já passou. */
function prazoVencido(prazoIso: string, agora: Date = new Date()): boolean {
  return new Date(prazoIso).getTime() < agora.getTime()
}

function textoComparacao(comparacao: LinhaLisura['comparacao']): string {
  switch (comparacao) {
    case 'CONFORME':
      return 'Conforme o contrato'
    case 'ACIMA':
      return 'Acima do contrato'
    case 'ABAIXO':
      return 'Abaixo do contrato'
    default:
      return 'Sem preço no contrato'
  }
}

function round2(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100
}
