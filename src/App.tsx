import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './shared/components/AppLayout'
import HomePage from './features/home/HomePage'
import ConexaoPage from './features/diagnostico/ConexaoPage'
import NovaPreGuiaPage from './features/preguia/NovaPreGuiaPage'
import MinhasInformacoesPage from './features/beneficiario/BeneficiarioMyInfoPage'
import MinhasPreGuiasPage from './features/minhasPreGuias/MinhasPreGuiasPage'
import FilaPreGuiasRota from './features/filaPreGuias/FilaPreGuiasRota'
import SetorGuiasLayout from './features/filaPreGuias/SetorGuiasLayout'
import PreGuiaSetorRota from './features/preGuiaSetor/PreGuiaSetorRota'
import MedicoLayout from './features/medicoFusex/MedicoLayout'
import MedicoMinhasInformacoesPage from './features/medicoFusex/MedicoMyInfoPage'
import ChefeLayout from './features/chefeFusex/ChefeLayout'
import ChefeMinhasInformacoesPage from './features/chefeFusex/ChefeMyInfoPage'
import RecepcaoLayout from './features/guiasRecepcao/RecepcaoLayout'
import GuiasParaImpressaoPage from './features/guiasRecepcao/GuiasParaImpressaoPage'
import EmConstrucao from './shared/components/EmConstrucao'
import { GuiasParaAssinarChefe, GuiasParaAssinarMedico } from './features/guiasParaAssinar/GuiasParaAssinarRotas'
import BeneficiariosPage from './features/chefeBeneficiarios/BeneficiariosPage'
import NovaPreGuiaMedicoPage from './features/medicoFusex/NovaPreGuiaMedico'
import MedicosPage from './features/chefeMedicos/MedicosPage'
import CorrigirPreGuiasPage from './features/medicoFusex/CorrigirPreGuias/CorrigirPreGuiasPage'

export default function App() {
  return (
    <Routes>
      {/* Início geral: escolha do perfil (login simulado), sem layout */}
      <Route path="/" element={<HomePage />} />

      <Route element={<AppLayout />}>
        <Route path="/beneficiario/inicio" element={<EmConstrucao nome="Início" task="Tela não desenhada (espaço reservado)" />} />
        <Route path="/pre-guias" element={<MinhasPreGuiasPage />} />
        <Route path="/pre-guias/nova" element={<NovaPreGuiaPage />} />
        <Route path="/beneficiario/minhas-informacoes" element={<MinhasInformacoesPage />} />
        <Route path="/diagnostico/conexao" element={<ConexaoPage />} />
      </Route>

      <Route path="/medico" element={<MedicoLayout />}>
        <Route index element={<Navigate to="inicio" replace />} />
        <Route path="inicio" element={<EmConstrucao nome="Início" task="Tela não desenhada (espaço reservado)" />} />
        <Route path="nova-pre-guia" element={<NovaPreGuiaMedicoPage />} />
        <Route path="corrigir-pre-guias" element={<CorrigirPreGuiasPage />} />
        <Route path="corrigir-pre-guias/:id" element={<EmConstrucao nome="Corrigir pré-guia" task="T14-FE2" />} />
        <Route path="guias-para-assinar" element={<GuiasParaAssinarMedico />} />
        <Route path="minhas-informacoes" element={<MedicoMinhasInformacoesPage />} />
      </Route>

      <Route path="/chefe" element={<ChefeLayout />}>
        <Route index element={<Navigate to="guias-para-assinar" replace />} />
        <Route path="guias-para-assinar" element={<GuiasParaAssinarChefe />} />
        <Route path="beneficiarios" element={<BeneficiariosPage />} />
        <Route path="medicos" element={<MedicosPage />} />
        <Route path="minhas-informacoes" element={<ChefeMinhasInformacoesPage />} />
      </Route>

      <Route path="/setor-guias" element={<SetorGuiasLayout />}>
        <Route index element={<Navigate to="fila" replace />} />
        <Route path="fila" element={<FilaPreGuiasRota />} />
        <Route path="pre-guias/:id" element={<PreGuiaSetorRota />} />
      </Route>
      {/* rota antiga da fila */}
      <Route path="/fila-pre-guias" element={<Navigate to="/setor-guias/fila" replace />} />

      <Route path="/recepcao" element={<RecepcaoLayout />}>
        <Route index element={<Navigate to="guias-para-impressao" replace />} />
        <Route path="guias-para-impressao" element={<GuiasParaImpressaoPage />} />
      </Route>

      <Route path="*" element={<main className="app-main"><p>Página não encontrada.</p></main>} />
    </Routes>
  )
}
