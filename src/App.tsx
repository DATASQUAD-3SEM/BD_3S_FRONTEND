import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './shared/components/AppLayout'
import HomePage from './features/home/HomePage'
import ConexaoPage from './features/diagnostico/ConexaoPage'
import NovaPreGuiaPage from './features/preguia/NovaPreGuiaPage'
import MinhasInformacoesPage from './features/beneficiario/BeneficiarioMyInfoPage'
import MinhasPreGuiasPage from './features/MinhasPreGuias/MinhasPreGuiasPage'
import { BeneficiarioProvider } from './features/beneficiario/BeneficiarioContext'
import FilaPreGuiasPage from './features/FilaPreGuias/FilaPreGuiasPage'
import MedicoLayout from './features/medicoFusex/MedicoLayout'
import MedicoMinhasInformacoesPage from './features/medicoFusex/MedicoMyInfoPage'
import ChefeLayout from './features/chefeFusex/ChefeLayout'
import ChefeMinhasInformacoesPage from './features/chefeFusex/ChefeMyInfoPage'
import RecepcaoLayout from './features/guiasRecepcao/RecepcaoLayout'
import GuiasParaImpressaoPage from './features/guiasRecepcao/GuiasParaImpressaoPage'
import EmConstrucao from './shared/components/EmConstrucao'
import { GuiasParaAssinarChefe, GuiasParaAssinarMedico } from './features/guiasParaAssinar/GuiasParaAssinarRotas'



export default function App() {
  return (
    <BeneficiarioProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/pre-guias" element={<MinhasPreGuiasPage />} />
          <Route path="/pre-guias/nova" element={<NovaPreGuiaPage />} />
          <Route path="/fila-pre-guias" element={<FilaPreGuiasPage />} />
          <Route path="/diagnostico/conexao" element={<ConexaoPage />} />
          <Route path="/beneficiario/minhas-informacoes" element={<MinhasInformacoesPage />} />
          <Route path="*" element={<p>Pagina nao encontrada.</p>} />
        </Route>

        <Route path="/medico" element={<MedicoLayout />}>
          <Route path="guias-para-assinar" element={<GuiasParaAssinarMedico />} />
          <Route path="minhas-informacoes" element={<MedicoMinhasInformacoesPage />} />
        </Route>

        <Route path="/chefe" element={<ChefeLayout />}>
          <Route path="guias-para-assinar" element={<GuiasParaAssinarChefe />} />
          <Route
            path="beneficiarios"
            element={<EmConstrucao nome="Beneficiários" task="Tela do chefe" />}
          />
          <Route
            path="medicos"
            element={<EmConstrucao nome="Médicos" task="Tela do chefe" />}
          />
          <Route path="minhas-informacoes" element={<ChefeMinhasInformacoesPage />} />
        </Route>

        <Route path="/recepcao" element={<RecepcaoLayout />}>
          <Route index element={<Navigate to="guias-para-impressao" replace />} />
          <Route path="guias-para-impressao" element={<GuiasParaImpressaoPage />} />
        </Route>

      </Routes>
    </BeneficiarioProvider>
  )
}
