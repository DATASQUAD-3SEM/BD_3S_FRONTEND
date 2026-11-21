import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import ControleFluxoFatura from '../setorFatura/components/ControleFluxoFatura'
import SeloSituacao from '../setorFatura/components/SeloSituacao'
import { formatarDataCurta, formatarMoeda } from '../setorFatura/formatadores'
import VisualizadorPdf from '../espelhoOcs/VisualizadorPdf'
import '../setorFatura/setorFatura.css'
import { lisuraApi } from './api'
import {
  comparacaoDaLinha,
  contratoDaLinha,
  daTabela,
  errosDoRascunho,
  glosaDaLinha,
  gravaPreco,
  pedidosDeLisura,
  OBSERVACAO_MAXIMO,
  resumoLisura,
  rascunhosIniciais,
  type RascunhoLinha,
} from './lisura'
import type { FaturaLisuraDetalhe, LinhaLisura, LisuraApi } from './types'

interface Props {
  api?: LisuraApi
}

type Carga = 'carregando' | 'pronto' | 'erro'
const RESPONSAVEL_MINIMO = 3
const RESPONSAVEL_MAXIMO = 100

/**
 * Tela "Lisura da fatura" (T25-FE-2): a rastreabilidade confere cada linha com o contrato, registra a glosa e, se
 * preciso, uma observação. Só a fatura Em lisura é editável; as demais abrem só para leitura.
 * Pendente, dependente de contrato do backend (ver ENTREGAS/PLANEJAMENTO_RODADA_1.md): faixa de decisão da OCS e a
 * marca "Ok pela OCS" / "Contestada pela OCS" por linha.
 */
export default function LisuraFaturaPage({ api = lisuraApi }: Props) {
  const { id } = useParams()
  const faturaId = Number(id)
  const [fatura, setFatura] = useState<FaturaLisuraDetalhe | null>(null)
  const [rascunhos, setRascunhos] = useState<Record<number, RascunhoLinha>>({})
  const [carga, setCarga] = useState<Carga>('carregando')
  const [responsavel, setResponsavel] = useState('')
  const [salvando, setSalvando] = useState(false)
  const [erroSalvar, setErroSalvar] = useState<string | null>(null)
  const [salvoOk, setSalvoOk] = useState(false)
  const [pdf, setPdf] = useState<{ guiaId: number; numero: string } | null>(null)

  useEffect(() => {
    let ativo = true
    api
      .detalhar(faturaId)
      .then((dados) => {
        if (!ativo) return
        setFatura(dados)
        setRascunhos(rascunhosIniciais(dados))
        setCarga('pronto')
      })
      .catch(() => {
        if (ativo) setCarga('erro')
      })
    return () => {
      ativo = false
    }
  }, [api, faturaId])

  const editavel = fatura?.situacao === 'EM_LISURA'
  const resumo = useMemo(
    () => (fatura ? resumoLisura(fatura.linhas, rascunhos) : null),
    [fatura, rascunhos],
  )

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

  const precisaResponsavel = editavel && gravaPreco(fatura.linhas, rascunhos)

  function atualizar(itemId: number, mudanca: Partial<RascunhoLinha>) {
    setSalvoOk(false)
    setRascunhos((atuais) => ({ ...atuais, [itemId]: { ...atuais[itemId], ...mudanca } }))
  }

  async function salvar() {
    if (!fatura) return
    const erros = errosDoRascunho(fatura.linhas, rascunhos)
    const nome = responsavel.trim()
    if (precisaResponsavel && (nome.length < RESPONSAVEL_MINIMO || nome.length > RESPONSAVEL_MAXIMO)) {
      erros.push('Informe o nome do responsável (3 a 100 caracteres) para gravar o preço na tabela da OCS.')
    }
    if (erros.length > 0) {
      setErroSalvar(erros.join(' '))
      return
    }
    setSalvando(true)
    setErroSalvar(null)
    try {
      const atualizada = await api.salvarLisura(
        faturaId,
        precisaResponsavel ? nome : null,
        pedidosDeLisura(fatura.linhas, rascunhos),
      )
      setFatura(atualizada)
      setRascunhos(rascunhosIniciais(atualizada))
      setSalvoOk(true)
    } catch (e) {
      setErroSalvar(e instanceof Error ? e.message : 'Não foi possível salvar a lisura.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <section className="sf">
      <Link to="/rastreabilidade/faturas-recebidas" className="sf-voltar">
        ← Faturas recebidas
      </Link>

      <header className="sf-cabecalho">
        <h1>Lisura da fatura nº {fatura.numeroFatura ?? '—'}</h1>
        <p className="sf-subtitulo">
          {fatura.ocs} · Entrada em {formatarDataCurta(fatura.dataEntrada)} <SeloSituacao situacao={fatura.situacao} />
        </p>
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
          <span>Valor final após lisura{resumo.parcial ? ' (parcial)' : ''}</span>
          <strong>{formatarMoeda(resumo.valorFinal)}</strong>
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
              <th scope="col">Valor de acordo com o contrato?</th>
              <th scope="col">Contrato (R$/sessão)</th>
              <th scope="col">Glosa (R$)</th>
              <th scope="col">Situação</th>
              <th scope="col">Observação</th>
            </tr>
          </thead>
          <tbody>
            {fatura.linhas.map((linha) => (
              <LinhaDaLisura
                key={linha.itemId}
                linha={linha}
                ocs={fatura.ocs}
                rascunho={rascunhos[linha.itemId]}
                editavel={editavel}
                onMudar={(mudanca) => atualizar(linha.itemId, mudanca)}
                onVerPdf={() => setPdf({ guiaId: linha.guiaId, numero: linha.guiaNumero })}
              />
            ))}
          </tbody>
        </table>
      </div>

      <p className="sf-rodape">
        <strong>VALOR FINAL APÓS LISURA:</strong> {formatarMoeda(resumo.valorFinal)}
        {resumo.parcial && ` · Faltam ${resumo.total - resumo.decididas} linha(s) sem decisão.`}
      </p>

      {editavel && (
        <div className="sf-acoes">
          {precisaResponsavel && (
            <label>
              Responsável pelo preço (seu nome)
              <input value={responsavel} onChange={(e) => setResponsavel(e.target.value)} maxLength={RESPONSAVEL_MAXIMO} />
            </label>
          )}
          {erroSalvar && (
            <p className="sf-erro" role="alert">
              {erroSalvar}
            </p>
          )}
          {salvoOk && <p role="status">Lisura salva.</p>}
          <button type="button" className="sf-botao" onClick={salvar} disabled={salvando}>
            {salvando ? 'Salvando…' : 'Salvar lisura'}
          </button>
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

interface LinhaProps {
  linha: LinhaLisura
  ocs: string
  rascunho: RascunhoLinha
  editavel: boolean
  onMudar: (mudanca: Partial<RascunhoLinha>) => void
  onVerPdf: () => void
}

function LinhaDaLisura({ linha, ocs, rascunho, editavel, onMudar, onVerPdf }: LinhaProps) {
  const tabela = daTabela(linha)
  const contrato = contratoDaLinha(linha, rascunho)
  const glosa = glosaDaLinha(linha, contrato)
  const comparacao = comparacaoDaLinha(linha, contrato)
  const abrirPanel = editavel && (tabela ? rascunho.corrigir : rascunho.decisao === 'nao')

  return (
    <>
      <tr>
        <td>
          {linha.guiaNumero} · {linha.paciente}
          <div>
            <button type="button" className="sf-link" onClick={onVerPdf}>
              Ver guia (PDF)
            </button>
          </div>
        </td>
        <td>
          {linha.codigo} · {linha.procedimento}
        </td>
        <td>{linha.quantidadeSessoes}</td>
        <td>{formatarMoeda(linha.valorSessao)}</td>
        <td>
          {tabela ? (
            <>
              <span>Comparado pelo sistema</span>
              {editavel && (
                <button type="button" className="sf-link" onClick={() => onMudar({ corrigir: !rascunho.corrigir })}>
                  O valor mudou?
                </button>
              )}
            </>
          ) : editavel ? (
            <div role="group" aria-label={`Valor de acordo com o contrato, guia ${linha.guiaNumero}`}>
              <button
                type="button"
                className="sf-botao sf-botao--secundario"
                aria-pressed={rascunho.decisao === 'sim'}
                onClick={() => onMudar({ decisao: rascunho.decisao === 'sim' ? null : 'sim' })}
              >
                Sim
              </button>
              <button
                type="button"
                className="sf-botao sf-botao--secundario"
                aria-pressed={rascunho.decisao === 'nao'}
                onClick={() => onMudar({ decisao: rascunho.decisao === 'nao' ? null : 'nao' })}
              >
                Não
              </button>
              {rascunho.decisao === null && <span className="sf-pequeno"> Falta decidir</span>}
            </div>
          ) : (
            <span>
              {linha.origemContrato === 'CONFERIDO' ? 'Sim' : linha.origemContrato === 'MANUAL' ? 'Não' : '—'}
            </span>
          )}
        </td>
        <td>
          {contrato === null ? '—' : formatarMoeda(contrato)}
          {tabela && <span className="sf-selo"> {rascunho.corrigir ? 'Tabela (corrigida)' : 'Tabela'}</span>}
          {!tabela && rascunho.decisao === 'sim' && <span className="sf-selo"> Conferido</span>}
          {!tabela && rascunho.decisao === 'nao' && contrato !== null && <span className="sf-selo"> Manual</span>}
        </td>
        <td>{glosa === null || glosa === 0 ? '—' : formatarMoeda(glosa)}</td>
        <td>{textoSituacao(comparacao)}</td>
        <td>
          {editavel ? (
            <>
              <textarea
                aria-label={`Observação da guia ${linha.guiaNumero}`}
                value={rascunho.observacao}
                maxLength={OBSERVACAO_MAXIMO + 1}
                onChange={(e) => onMudar({ observacao: e.target.value })}
              />
              <span className="sf-pequeno">
                {rascunho.observacao.length}/{OBSERVACAO_MAXIMO}
              </span>
            </>
          ) : (
            linha.observacao ?? '—'
          )}
        </td>
      </tr>

      {abrirPanel && (
        <tr>
          <td colSpan={9}>
            {tabela ? (
              <div className="sf-painel">
                <p>Se o valor sofreu alguma alteração, insira o novo valor aqui.</p>
                <label>
                  Novo valor (R$/sessão)
                  <input value={rascunho.valor} onChange={(e) => onMudar({ valor: e.target.value })} />
                </label>
                <p className="sf-pequeno">
                  Valor atual na tabela de {ocs}: {linha.valorContrato == null ? '—' : formatarMoeda(linha.valorContrato)}.
                  Ao salvar a lisura, o novo valor substitui o da tabela e fica salvo para as próximas faturas.
                </p>
                <button type="button" className="sf-botao sf-botao--secundario" onClick={() => onMudar({ corrigir: false, valor: '' })}>
                  Cancelar correção
                </button>
              </div>
            ) : (
              <div className="sf-painel">
                <p>
                  Este exame não tem valor de contrato cadastrado para {ocs}. Insira o valor de contrato aqui, ficará salvo.
                </p>
                <label>
                  Valor de contrato (R$/sessão)
                  <input value={rascunho.valor} onChange={(e) => onMudar({ valor: e.target.value })} />
                </label>
                <p className="sf-pequeno">
                  Ao salvar a lisura, o valor entra na tabela de preços desta OCS e as próximas faturas com o código{' '}
                  {linha.codigo} já chegam comparadas pelo sistema.
                </p>
              </div>
            )}
          </td>
        </tr>
      )}
    </>
  )
}

function textoSituacao(comparacao: LinhaLisura['comparacao']): string {
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
