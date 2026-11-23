import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../../shared/api/http'
import { formatarCpf, formatarData, formatarPrecCp } from '../../shared/utils/formatadores'
import { salvarAssinatura } from './beneficiarioApi'
import AssinaturaDigital from './components/AssinaturaDigital'
import '../chefeDependentes/dependentes.css'

/** GET /responsavel/me (T31-BE5). */
export interface ResponsavelMe {
  nome: string | null
  cpf: string
  temAssinatura: boolean
}

/** GET /responsavel/menores (T31-BE5): menores vigentes que o responsável acompanha. */
export interface MenorAcompanhado {
  dependenteId: number
  nome: string
  vinculo: string | null
  precCp: string
  idade: number
  vigenciaFim: string | null
  titularNome: string
}

/** GET /dependente/me (T31-BE5): cadastro do dependente maior, só leitura. */
export interface DependenteMe {
  nome: string
  precCp: string
  vinculo: string | null
  vigenciaFim: string | null
  vigente: boolean
  titularNome: string
  temAssinatura: boolean
}

export interface MinhasInformacoesOutrosApi {
  responsavel(): Promise<ResponsavelMe>
  menores(): Promise<MenorAcompanhado[]>
  dependente(): Promise<DependenteMe>
  salvarAssinatura(imagem: Blob): Promise<void>
}

export const minhasInformacoesOutrosApi: MinhasInformacoesOutrosApi = {
  responsavel: () => get<ResponsavelMe>('/responsavel/me'),
  menores: () => get<MenorAcompanhado[]>('/responsavel/menores'),
  dependente: () => get<DependenteMe>('/dependente/me'),
  salvarAssinatura,
}

function vigencia(fim: string | null): string {
  return fim ? `Até ${formatarData(fim)}` : 'Vitalícia'
}

/** "filha de Antonio Ferreira" a partir do vínculo cadastrado (sem vínculo: "dependente de ..."). */
export function relacaoComTitular(vinculo: string | null, titular: string): string {
  return `${(vinculo ?? 'dependente').toLowerCase()} de ${titular}`
}

/**
 * Minhas informações do responsável legal externo (T31-FE5): dados pessoais (sem Prec CP), assinatura digital e
 * os menores vigentes que acompanha, com "Criar pré-guia" (o menor já escolhido).
 */
export function MinhasInformacoesResponsavel({ api = minhasInformacoesOutrosApi }: { api?: MinhasInformacoesOutrosApi }) {
  const [dados, setDados] = useState<ResponsavelMe | null>(null)
  const [menores, setMenores] = useState<MenorAcompanhado[] | null>(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let ativo = true
    Promise.all([api.responsavel(), api.menores()])
      .then(([eu, lista]) => {
        if (!ativo) return
        setDados(eu)
        setMenores(lista)
      })
      .catch(() => {
        if (ativo) setErro(true)
      })
    return () => {
      ativo = false
    }
  }, [api])

  if (erro) return <p role="alert">Não foi possível carregar os seus dados.</p>
  if (!dados || !menores) return <p role="status">Carregando…</p>

  return (
    <div className="minhas-info-page">
      <h1>Minhas informações</h1>
      <section className="info-card" aria-label="Dados pessoais">
        <h2>Dados pessoais</h2>
        <div className="info-grid">
          <div className="info-dado">
            <span>Nome</span>
            <p>{dados.nome ?? '—'}</p>
          </div>
          <div className="info-dado">
            <span>CPF</span>
            <p>{formatarCpf(dados.cpf)}</p>
          </div>
        </div>
        <p className="info-observacao">
          Como responsável legal, você não tem Prec CP: entra com o seu CPF. Para alterar esses dados, procure o chefe
          do FUSEX.
        </p>
      </section>

      <AssinaturaDigital
        cadastrada={dados.temAssinatura}
        onSalvar={async (imagem) => {
          await api.salvarAssinatura(imagem)
          setDados({ ...dados, temAssinatura: true })
        }}
      />

      <section className="info-card" aria-label="Menores que acompanho">
        <h2>Menores que acompanho</h2>
        {menores.length === 0 && <p>Nenhum menor vigente sob a sua responsabilidade.</p>}
        <ul className="dep-lista">
          {menores.map((m) => (
            <li key={m.dependenteId}>
              <article className="dep-cartao" aria-label={`Menor ${m.nome}`}>
                <header className="dep-cartao-cabecalho">
                  <strong>{m.nome}</strong>
                  <span>{relacaoComTitular(m.vinculo, m.titularNome)}</span>
                </header>
                <dl className="dep-dados">
                  <div>
                    <dt>Prec CP</dt>
                    <dd>{formatarPrecCp(m.precCp)}</dd>
                  </div>
                  <div>
                    <dt>Idade</dt>
                    <dd>{m.idade} anos</dd>
                  </div>
                  <div>
                    <dt>Vigência</dt>
                    <dd>{vigencia(m.vigenciaFim)}</dd>
                  </div>
                </dl>
                <div className="dep-acoes">
                  <Link className="dep-botao" to={`/pre-guias/nova?paciente=${m.dependenteId}`}>
                    Criar pré-guia
                  </Link>
                </div>
              </article>
            </li>
          ))}
        </ul>
      </section>
    </div>
  )
}

/** Minhas informações do dependente maior (T31-FE5): dados pessoais só leitura e assinatura digital. */
export function MinhasInformacoesDependenteMaior({
  api = minhasInformacoesOutrosApi,
  mensagemErro = 'Não foi possível carregar os seus dados.',
}: {
  api?: MinhasInformacoesOutrosApi
  mensagemErro?: string
}) {
  const [dados, setDados] = useState<DependenteMe | null>(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let ativo = true
    api
      .dependente()
      .then((d) => {
        if (ativo) setDados(d)
      })
      .catch(() => {
        if (ativo) setErro(true)
      })
    return () => {
      ativo = false
    }
  }, [api])

  if (erro) return <p role="alert">{mensagemErro}</p>
  if (!dados) return <p role="status">Carregando…</p>

  return (
    <div className="minhas-info-page">
      <h1>Minhas informações</h1>
      <section className="info-card" aria-label="Dados pessoais">
        <h2>Dados pessoais</h2>
        <div className="info-grid">
          <div className="info-dado">
            <span>Nome</span>
            <p>{dados.nome}</p>
          </div>
          <div className="info-dado">
            <span>Prec CP</span>
            <p>{formatarPrecCp(dados.precCp)}</p>
          </div>
          <div className="info-dado">
            <span>Vínculo</span>
            <p>{dados.vinculo ?? '—'}</p>
          </div>
          <div className="info-dado">
            <span>Vigência</span>
            <p>{vigencia(dados.vigenciaFim)}</p>
          </div>
          <div className="info-dado">
            <span>Titular</span>
            <p>{dados.titularNome}</p>
          </div>
        </div>
        <p className="info-observacao">Para alterar esses dados, procure o chefe do FUSEX.</p>
      </section>

      <AssinaturaDigital
        cadastrada={dados.temAssinatura}
        onSalvar={async (imagem) => {
          await api.salvarAssinatura(imagem)
          setDados({ ...dados, temAssinatura: true })
        }}
      />
    </div>
  )
}
