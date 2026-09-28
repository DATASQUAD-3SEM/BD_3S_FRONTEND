import { Route, Routes } from 'react-router-dom'
import AppLayout from './shared/components/AppLayout'
import HomePage from './features/home/HomePage'
import ConexaoPage from './features/diagnostico/ConexaoPage'
import NovaPreGuiaPage from './features/preguia/NovaPreGuiaPage'

/**
 * TABELA DE ROTAS - unico lugar onde as rotas sao declaradas.
 * Nova tela? Crie a pasta da feature e adicione UMA linha aqui (PR pequeno e rapido,
 * para nao dar conflito).
 */
export default function App() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/pre-guias/nova" element={<NovaPreGuiaPage />} />
        <Route path="/diagnostico/conexao" element={<ConexaoPage />} />
        <Route path="*" element={<p>Pagina nao encontrada.</p>} />
      </Route>
    </Routes>
  )
}
