import { Navigate, Route, Routes } from 'react-router-dom'
import AppLayout from './shared/components/AppLayout'
import LoginPage from './features/login/LoginPage'
import RotaProtegida from './shared/auth/RotaProtegida'
import { lerSessao } from './shared/auth/sessao'
import { INICIO_PERFIL } from './shared/layout/perfis'
import ConexaoPage from './features/diagnostico/ConexaoPage'
import NovaPreGuiaPage from './features/novaPreGuia/NovaPreGuiaPage'
import MinhasInformacoesPage from './features/beneficiario/BeneficiarioMyInfoPage'
import MinhasPreGuiasRota from './features/minhasPreGuias/MinhasPreGuiasRota'
import CorrecaoPreGuiaRota from './features/minhasPreGuias/correcao/CorrecaoPreGuiaRota'
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
import CorrigirPreGuiaPage from './features/medicoFusex/CorrigirPreGuias/CorrigirPreGuiaPage'

/**
 * Tabela de rotas da aplicacao. Cada perfil tem um layout proprio (menu lateral e barra superior)
 * e as telas sao rotas filhas desse layout. Ao criar uma tela nova, adicione aqui apenas a rota correspondente.
 *
 * Cada area fica dentro de uma RotaProtegida: sem login, a pessoa vai para /login; com outro perfil,
 * volta para o inicio do proprio perfil.
 */

/** Raiz do site: quem ja entrou vai para a propria area; quem nao entrou, para o login. */
function Raiz() {
  const sessao = lerSessao()
  return <Navigate to={sessao ? INICIO_PERFIL[sessao.perfil] : '/login'} replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Raiz />} />
      <Route path="/login" element={<LoginPage />} />
      {/* Teste de conexao com o backend: aberto, sem login */}
      <Route path="/diagnostico/conexao" element={<main className="app-main"><ConexaoPage /></main>} />

      <Route element={<RotaProtegida perfil="BENEFICIARIO"><AppLayout /></RotaProtegida>}>
        <Route path="/beneficiario/inicio" element={<EmConstrucao nome="Início" task="Tela não desenhada (espaço reservado)" />} />
        <Route path="/pre-guias" element={<MinhasPreGuiasRota />} />
        <Route path="/pre-guias/:id/corrigir" element={<CorrecaoPreGuiaRota />} />
        <Route path="/pre-guias/nova" element={<NovaPreGuiaPage />} />
        <Route path="/beneficiario/minhas-informacoes" element={<MinhasInformacoesPage />} />
      </Route>

      <Route path="/medico" element={<RotaProtegida perfil="MEDICO"><MedicoLayout /></RotaProtegida>}>
        <Route index element={<Navigate to="inicio" replace />} />
        <Route path="inicio" element={<EmConstrucao nome="Início" task="Tela não desenhada (espaço reservado)" />} />
        <Route path="nova-pre-guia" element={<NovaPreGuiaMedicoPage />} />
        <Route path="corrigir-pre-guias" element={<CorrigirPreGuiasPage />} />
        <Route path="corrigir-pre-guias/:id" element={<CorrigirPreGuiaPage />} />
        <Route path="guias-para-assinar" element={<GuiasParaAssinarMedico />} />
        <Route path="minhas-informacoes" element={<MedicoMinhasInformacoesPage />} />
      </Route>

      <Route path="/chefe" element={<RotaProtegida perfil="CHEFE_FUSEX"><ChefeLayout /></RotaProtegida>}>
        <Route index element={<Navigate to="guias-para-assinar" replace />} />
        <Route path="guias-para-assinar" element={<GuiasParaAssinarChefe />} />
        <Route path="beneficiarios" element={<BeneficiariosPage />} />
        <Route path="medicos" element={<MedicosPage />} />
        <Route path="minhas-informacoes" element={<ChefeMinhasInformacoesPage />} />
      </Route>

      <Route path="/setor-guias" element={<RotaProtegida perfil="SETOR_GUIAS"><SetorGuiasLayout /></RotaProtegida>}>
        <Route index element={<Navigate to="fila" replace />} />
        <Route path="fila" element={<FilaPreGuiasRota />} />
        <Route path="pre-guias/:id" element={<PreGuiaSetorRota />} />
      </Route>
      {/* rota antiga da fila */}
      <Route path="/fila-pre-guias" element={<Navigate to="/setor-guias/fila" replace />} />

      <Route path="/recepcao" element={<RotaProtegida perfil="RECEPCAO"><RecepcaoLayout /></RotaProtegida>}>
        <Route index element={<Navigate to="guias-para-impressao" replace />} />
        <Route path="guias-para-impressao" element={<GuiasParaImpressaoPage />} />
      </Route>

      <Route path="*" element={<main className="app-main"><p>Página não encontrada.</p></main>} />
    </Routes>
  )
}
