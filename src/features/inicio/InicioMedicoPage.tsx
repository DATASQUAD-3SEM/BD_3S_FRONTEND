import { Link } from 'react-router-dom'
import type { MedicoPerfil } from '../../shared/types/domain'
import { guiasParaAssinarApi } from '../guiasParaAssinar/api'
import type { GuiaParaAssinar } from '../guiasParaAssinar/types'
import { corrigirPreGuiasApi } from '../medicoFusex/CorrigirPreGuias/corrigirPreGuiasApi'
import type { PreGuiaParaCorrigir } from '../medicoFusex/CorrigirPreGuias/types'
import { obterMedicoLogado } from '../medicoFusex/medicoApi'
import { Icone } from './icones'
import { Atalho, CartaoPendencia, useCarga } from './inicioComum'
import './inicio.css'

/**
 * T35-FE2: página Início do médico (rota /medico/inicio): as Guias que esperam a assinatura dele e as pré-guias
 * devolvidas para correção, com os números das mesmas listas das telas "Guias para assinar" e "Corrigir pré-guias".
 */

export interface InicioMedicoApi {
  medico(): Promise<MedicoPerfil>
  guiasParaAssinar(): Promise<GuiaParaAssinar[]>
  preGuiasParaCorrigir(): Promise<PreGuiaParaCorrigir[]>
}

export const inicioMedicoApi: InicioMedicoApi = {
  medico: obterMedicoLogado,
  guiasParaAssinar: () => guiasParaAssinarApi.listar(),
  preGuiasParaCorrigir: () => corrigirPreGuiasApi.listarParaCorrigir(),
}

export default function InicioMedicoPage({ api = inicioMedicoApi }: { api?: InicioMedicoApi }) {
  const medico = useCarga(api.medico)
  const guias = useCarga(api.guiasParaAssinar)
  const preGuias = useCarga(api.preGuiasParaCorrigir)

  const dados = medico.estado === 'ok' ? medico.dados : null
  // A lista de Guias para assinar traz as pendências de cada Guia: conta só as que esperam o médico.
  const paraAssinar = guias.estado === 'ok' ? guias.dados.filter((g) => g.pendencias.includes('MEDICO')).length : null
  const paraCorrigir = preGuias.estado === 'ok' ? preGuias.dados.length : null

  return (
    <div className="inicio">
      <header className="inicio-boas-vindas">
        <div>
          <p className="inicio-sobretitulo">Início</p>
          <h1>{dados ? `Olá, ${`${dados.patente} ${dados.nome}`.trim()}` : 'Olá'}</h1>
          <p className="inicio-frase">{dados?.crm ? `CRM ${dados.crm}` : ' '}</p>
        </div>
        <Link to="/medico/nova-pre-guia" className="inicio-cta">
          <Icone nome="mais" />
          Nova pré-guia
        </Link>
      </header>

      <section aria-labelledby="inicio-medico-pendencias">
        <h2 id="inicio-medico-pendencias" className="inicio-secao">
          O que precisa da sua atenção
        </h2>
        <ul className="inicio-cartoes">
          <CartaoPendencia
            icone="caneta"
            tom="destaque"
            titulo="Guias para assinar"
            descricao="Guias concluídas pelo setor de Guias que esperam a sua assinatura."
            quantidade={paraAssinar}
            erro={guias.estado === 'erro'}
            destino="/medico/guias-para-assinar"
            acao="Assinar guias"
          />
          <CartaoPendencia
            icone="alerta"
            tom="alerta"
            titulo="Pré-guias para corrigir"
            descricao="Pré-guias que você criou e o setor de Guias devolveu para correção."
            quantidade={paraCorrigir}
            erro={preGuias.estado === 'erro'}
            destino="/medico/corrigir-pre-guias"
            acao="Corrigir"
          />
        </ul>
      </section>

      <section aria-labelledby="inicio-medico-atalhos">
        <h2 id="inicio-medico-atalhos" className="inicio-secao">
          Atalhos
        </h2>
        <nav className="inicio-atalhos" aria-labelledby="inicio-medico-atalhos">
          <Atalho icone="mais" destino="/medico/nova-pre-guia" titulo="Nova pré-guia" descricao="Busque o beneficiário pelo Prec CP e escolha os exames e a OCS." />
          <Atalho icone="pessoa" destino="/medico/minhas-informacoes" titulo="Minhas informações" descricao="Seus dados, sua senha e sua assinatura." />
        </nav>
      </section>
    </div>
  )
}
