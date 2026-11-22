import type { ReactNode } from 'react'
import { formatarData, formatarPrecCp } from '../../shared/utils/formatadores'
import type { DependenteItem } from './tipos'

/** Selo do caso (T31-FE2): menor sob a guarda do titular, menor sob responsável legal ou maior de idade. */
export function seloDoCaso(tipo: DependenteItem['tipo']): string {
  switch (tipo) {
    case 'MENOR_TITULAR':
      return 'Menor · guarda do titular'
    case 'MENOR_RESPONSAVEL':
      return 'Menor · responsável legal'
    default:
      return 'Maior de idade'
  }
}

export function textoVigencia(vigenciaFim: string | null): string {
  return vigenciaFim ? `Até ${formatarData(vigenciaFim)}` : 'Vitalícia'
}

export function textoConta(temConta: boolean): string {
  return temConta ? 'Conta própria (login pelo CPF)' : 'Sem conta (acesso pelo responsável)'
}

/** Responsável legal com o papel depois do nome; nulo no maior (que age por si). */
export function textoResponsavel(dependente: Pick<DependenteItem, 'responsaveis'>): string | null {
  const responsavel = dependente.responsaveis[0]
  if (!responsavel) return null
  return `${responsavel.nome} ${responsavel.papel === 'TITULAR' ? '(titular)' : '(responsável externo)'}`
}

/** Vigentes primeiro, na ordem recebida; os de vigência vencida vão para o fim. */
export function ordenarVigentesPrimeiro<T extends { vigenciaVencida: boolean }>(lista: T[]): T[] {
  return [...lista.filter((d) => !d.vigenciaVencida), ...lista.filter((d) => d.vigenciaVencida)]
}

interface Props {
  dependente: DependenteItem
  /** Ações do cartão (ex.: "Editar" do chefe, "Criar pré-guia" do titular). */
  acoes?: ReactNode
}

/** Cartão de um dependente (T31-FE2; reaproveitado sem ações em Minhas informações, T31-FE4). */
export default function CartaoDependente({ dependente, acoes }: Props) {
  const responsavel = textoResponsavel(dependente)
  return (
    <article className="dep-cartao" aria-label={`Dependente ${dependente.nome}`}>
      <header className="dep-cartao-cabecalho">
        <strong>
          {dependente.nome}
          {dependente.vinculo ? ` · ${dependente.vinculo}` : ''}
        </strong>
        <span className="dep-selo">{seloDoCaso(dependente.tipo)}</span>
        {dependente.vigenciaVencida && dependente.vigenciaFim && (
          <span className="dep-selo dep-selo--vencida">Vigência vencida em {formatarData(dependente.vigenciaFim)}</span>
        )}
      </header>
      <dl className="dep-dados">
        <div>
          <dt>Prec CP</dt>
          <dd>{formatarPrecCp(dependente.precCp)}</dd>
        </div>
        <div>
          <dt>Idade</dt>
          <dd>{dependente.idade} anos</dd>
        </div>
        <div>
          <dt>Vigência</dt>
          <dd>{textoVigencia(dependente.vigenciaFim)}</dd>
        </div>
        <div>
          <dt>Conta</dt>
          <dd>{textoConta(dependente.temConta)}</dd>
        </div>
        {responsavel && (
          <div>
            <dt>Responsável legal</dt>
            <dd>{responsavel}</dd>
          </div>
        )}
      </dl>
      {acoes && <div className="dep-acoes">{acoes}</div>}
    </article>
  )
}
