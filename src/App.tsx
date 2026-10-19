import { Route, Routes } from 'react-router-dom'
import AppLayout from './shared/components/AppLayout'
import HomePage from './features/home/HomePage'
import ConexaoPage from './features/diagnostico/ConexaoPage'
import NovaPreGuiaPage from './features/preguia/NovaPreGuiaPage'
import NovaPreGuiaMedicoPage from './features/preguia/NovaPreGuiaMedicoPage'
import MinhasInformacoesPage from './features/beneficiario/BeneficiarioMyInfoPage'

import { BeneficiarioProvider } from './features/beneficiario/BeneficiarioContext'

/**
 * TABELA DE ROTAS - unico lugar onde as rotas sao declaradas.
 * Nova tela? Crie a pasta da feature e adicione UMA linha aqui (PR pequeno e rapido,
 * para nao dar conflito).
 */
export default function App() {
  return (
    <BeneficiarioProvider>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/pre-guias/nova" element={<NovaPreGuiaPage />} />
          <Route path="/medico/pre-guias/nova" element={<NovaPreGuiaMedicoPage />} />
          <Route path="/diagnostico/conexao" element={<ConexaoPage />} />
          <Route path="/beneficiario/minhas-informacoes" element={<MinhasInformacoesPage />} />
          <Route path="*" element={<p>Pagina nao encontrada.</p>} />
        </Route>
      </Routes>
    </BeneficiarioProvider>
  )
}
