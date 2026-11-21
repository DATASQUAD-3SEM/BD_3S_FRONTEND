import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { get } from '../../shared/api/http'
import CartaoDependente from '../chefeDependentes/CartaoDependente'
import type { DependenteItem, TipoDependente } from '../chefeDependentes/tipos'
import '../chefeDependentes/dependentes.css'

/** Dependente vigente do titular (GET /beneficiario/dependentes, T31-BE5). */
export interface DependenteDoTitular {
  dependenteId: number
  nome: string
  vinculo: string | null
  precCp: string
  idade: number
  tipo: TipoDependente
  vigenciaFim: string | null
  podeCriarPreGuia: boolean
}

export const carregarDependentesDoTitular = () => get<DependenteDoTitular[]>('/beneficiario/dependentes')

/** Adapta ao cartão da T31-FE2: o menor sob a guarda do titular tem o próprio titular como responsável. */
function paraCartao(d: DependenteDoTitular, titularNome: string): DependenteItem {
  return {
    dependenteId: d.dependenteId,
    nome: d.nome,
    vinculo: d.vinculo,
    precCp: d.precCp,
    dataNascimento: '',
    idade: d.idade,
    tipo: d.tipo,
    vigenciaFim: d.vigenciaFim,
    vigenciaVencida: false,
    temConta: d.tipo === 'MAIOR',
    responsaveis: d.tipo === 'MENOR_TITULAR' ? [{ usuarioId: 0, nome: titularNome, papel: 'TITULAR' }] : [],
  }
}

interface Props {
  titularNome: string
  carregar?: () => Promise<DependenteDoTitular[]>
}

/**
 * Minhas informações › Dependentes (T31-FE4): os dependentes vigentes do titular, só para leitura. Nos menores
 * sob a guarda dele, "Criar pré-guia" abre a Nova pré-guia com o menor já escolhido (T30-FE1).
 */
export default function DependentesAba({ titularNome, carregar = carregarDependentesDoTitular }: Props) {
  const [dependentes, setDependentes] = useState<DependenteDoTitular[] | null>(null)
  const [erro, setErro] = useState(false)

  useEffect(() => {
    let ativo = true
    carregar()
      .then((lista) => {
        if (ativo) setDependentes(lista)
      })
      .catch(() => {
        if (ativo) setErro(true)
      })
    return () => {
      ativo = false
    }
  }, [carregar])

  return (
    <section className="info-card" aria-label="Dependentes">
      <h2>Dependentes</h2>
      <p>
        Seus dependentes, cadastrados pelo chefe do FUSEX. Para incluir ou alterar um dependente, procure o chefe do
        FUSEX.
      </p>
      {erro && <p role="alert">Não foi possível carregar os dependentes.</p>}
      {!erro && dependentes === null && <p role="status">Carregando dependentes…</p>}
      {dependentes !== null && dependentes.length === 0 && <p>Nenhum dependente cadastrado.</p>}
      {dependentes !== null && dependentes.length > 0 && (
        <ul className="dep-lista">
          {dependentes.map((d) => (
            <li key={d.dependenteId}>
              <CartaoDependente
                dependente={paraCartao(d, titularNome)}
                acoes={
                  d.podeCriarPreGuia ? (
                    <Link className="dep-botao" to={`/pre-guias/nova?paciente=${d.dependenteId}`}>
                      Criar pré-guia
                    </Link>
                  ) : d.tipo === 'MAIOR' ? (
                    <span className="dep-aviso">Maior de idade, com conta própria: cria as próprias pré-guias.</span>
                  ) : undefined
                }
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
