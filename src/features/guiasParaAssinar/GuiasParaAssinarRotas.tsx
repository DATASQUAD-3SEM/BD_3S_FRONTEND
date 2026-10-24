import { useChefe } from '../chefeFusex/ChefeContext'
import { useMedico } from '../medicoFusex/MedicoContext'
import { USAR_MOCK_GUIAS_ASSINAR } from './api'
import { criarGuiasParaAssinarMock } from './api.mock'
import GuiasParaAssinarPage from './GuiasParaAssinarPage'

// Criados uma vez, fora do render: a pagina usa o api como dependencia de efeito
const apiMedicoMock = USAR_MOCK_GUIAS_ASSINAR ? criarGuiasParaAssinarMock('MEDICO') : undefined
const apiChefeMock = USAR_MOCK_GUIAS_ASSINAR ? criarGuiasParaAssinarMock('CHEFE') : undefined

export function GuiasParaAssinarMedico() {
  const { medico, carregando } = useMedico()

  return (
    <GuiasParaAssinarPage
      perfil="MEDICO"
      assinaturaCadastrada={carregando || !medico ? null : medico.assinaturaCadastrada}
      identificacao={medico ? `${medico.patente} ${medico.nome}` : undefined}
      linkMinhasInformacoes="/medico/minhas-informacoes"
      api={apiMedicoMock}
    />
  )
}

export function GuiasParaAssinarChefe() {
  const { chefe, carregando } = useChefe()

  return (
    <GuiasParaAssinarPage
      perfil="CHEFE"
      assinaturaCadastrada={carregando || !chefe ? null : chefe.assinaturaCadastrada}
      identificacao={chefe ? `${chefe.patente} ${chefe.nome}` : undefined}
      linkMinhasInformacoes="/chefe/minhas-informacoes"
      api={apiChefeMock}
    />
  )
}
