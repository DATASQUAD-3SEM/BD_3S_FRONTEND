import { Link } from 'react-router-dom'
import type { GuiaDoBeneficiario } from '../minhasGuias/types'
import type { PreGuiaDoBeneficiario } from '../minhasPreGuias/types'
import { inicioApi, type InicioApi, type PessoaInicio, type TipoPessoaInicio } from './inicioApi'
import { Icone } from './icones'
import { Atalho, CartaoPendencia, useCarga } from './inicioComum'
import './inicio.css'

/**
 * T35-FE1: página Início do titular, do dependente maior e do responsável legal (rota /beneficiario/inicio).
 * Mostra o que a pessoa tem a fazer (contado a partir das listas de Minhas pré-guias e Minhas guias) e atalhos.
 */

const FRASE: Record<TipoPessoaInicio, string> = {
  TITULAR: 'Aqui você acompanha as suas pré-guias e guias e as dos seus dependentes menores.',
  DEPENDENTE_MAIOR: 'Aqui você acompanha as suas pré-guias e guias.',
  RESPONSAVEL: 'Aqui você acompanha as pré-guias e guias dos menores que você acompanha como responsável legal.',
}

interface Props {
  api?: InicioApi
}

export function primeiroNome(nome: string): string {
  return nome.trim().split(/\s+/)[0] ?? ''
}

export function contarPendencias(preGuias: PreGuiaDoBeneficiario[] | null, guias: GuiaDoBeneficiario[] | null) {
  return {
    atencao: preGuias?.filter((p) => p.status === 'ATENCAO').length ?? null,
    comSetor: preGuias?.filter((p) => p.status === 'PENDENTE' || p.status === 'EM_ANALISE').length ?? null,
    naoEnviadas: guias?.filter((g) => g.situacao === 'NAO_ENVIADA').length ?? null,
    sessoesParaAssinar:
      guias?.reduce((total, g) => total + g.sessoes.filter((s) => s.status === 'SOLICITADA').length, 0) ?? null,
  }
}

export default function InicioBeneficiarioPage({ api = inicioApi }: Props) {
  const pessoa = useCarga<PessoaInicio>(api.pessoa)
  const preGuias = useCarga<PreGuiaDoBeneficiario[]>(api.preGuias)
  const guias = useCarga<GuiaDoBeneficiario[]>(api.guias)

  const n = contarPendencias(
    preGuias.estado === 'ok' ? preGuias.dados : null,
    guias.estado === 'ok' ? guias.dados : null,
  )
  const dadosPessoa = pessoa.estado === 'ok' ? pessoa.dados : null
  const semAssinatura = dadosPessoa !== null && !dadosPessoa.temAssinatura && (n.sessoesParaAssinar ?? 0) > 0

  return (
    <div className="inicio">
      <header className="inicio-boas-vindas">
        <div>
          <p className="inicio-sobretitulo">Início</p>
          <h1>{dadosPessoa?.nome ? `Olá, ${primeiroNome(dadosPessoa.nome)}` : 'Olá'}</h1>
          <p className="inicio-frase">{dadosPessoa ? FRASE[dadosPessoa.tipo] : ' '}</p>
        </div>
        <Link to="/pre-guias/nova" className="inicio-cta">
          <Icone nome="mais" />
          Nova pré-guia
        </Link>
      </header>

      {semAssinatura && (
        <div className="inicio-alerta" role="alert">
          <Icone nome="assinatura" />
          <p>
            Você tem sessões para assinar, mas ainda não cadastrou a sua assinatura. Cadastre em Minhas informações.
          </p>
          <Link to="/beneficiario/minhas-informacoes" className="inicio-alerta-botao">
            Cadastrar assinatura
          </Link>
        </div>
      )}

      <section aria-labelledby="inicio-pendencias">
        <h2 id="inicio-pendencias" className="inicio-secao">
          O que precisa da sua atenção
        </h2>
        <ul className="inicio-cartoes">
          <CartaoPendencia
            icone="alerta"
            tom="alerta"
            titulo="Precisam de correção"
            descricao="Pré-guias em Atenção: o setor de Guias pediu uma correção."
            quantidade={n.atencao}
            erro={preGuias.estado === 'erro'}
            destino="/pre-guias"
            acao="Ver pré-guias"
          />
          <CartaoPendencia
            icone="relogio"
            tom="info"
            titulo="Com o setor de Guias"
            descricao="Pré-guias Pendentes ou Em análise, aguardando a Guia."
            quantidade={n.comSetor}
            erro={preGuias.estado === 'erro'}
            destino="/pre-guias"
            acao="Acompanhar"
          />
          <CartaoPendencia
            icone="enviar"
            tom="sucesso"
            titulo="Prontas para enviar à OCS"
            descricao="Guias Não enviadas: envie para a OCS pedir as sessões."
            quantidade={n.naoEnviadas}
            erro={guias.estado === 'erro'}
            destino="/guias"
            acao="Enviar guias"
          />
          <CartaoPendencia
            icone="assinatura"
            tom="destaque"
            titulo="Sessões para assinar"
            descricao="Sessões que a OCS pediu para você assinar."
            quantidade={n.sessoesParaAssinar}
            erro={guias.estado === 'erro'}
            destino="/guias"
            acao="Assinar sessões"
          />
        </ul>
      </section>

      <section aria-labelledby="inicio-atalhos">
        <h2 id="inicio-atalhos" className="inicio-secao">
          Atalhos
        </h2>
        <nav className="inicio-atalhos" aria-labelledby="inicio-atalhos">
          <Atalho icone="mais" destino="/pre-guias/nova" titulo="Nova pré-guia" descricao="Anexe o encaminhamento médico e escolha a OCS." />
          <Atalho icone="documento" destino="/pre-guias" titulo="Minhas pré-guias" descricao="Acompanhe a análise e corrija o que for pedido." />
          <Atalho icone="guia" destino="/guias" titulo="Minhas guias" descricao="Envie à OCS, assine as sessões e veja o PDF." />
          <Atalho icone="pessoa" destino="/beneficiario/minhas-informacoes" titulo="Minhas informações" descricao="Seus dados, sua senha e sua assinatura." />
        </nav>
      </section>
    </div>
  )
}
