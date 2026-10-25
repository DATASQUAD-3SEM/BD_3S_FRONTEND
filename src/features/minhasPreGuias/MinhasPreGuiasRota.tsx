import { useLocation, useNavigate } from 'react-router-dom';
import MinhasPreGuiasPage from './MinhasPreGuiasPage';
import './correcao/correcao.css';

/** Liga /pre-guias à lista: o botão "Visualizar e corrigir" abre a correção; o reenvio volta com mensagem. */
export default function MinhasPreGuiasRota() {
  const navigate = useNavigate();
  const location = useLocation();
  const mensagemSucesso = (location.state as { mensagem?: string } | null)?.mensagem;

  return (
    <>
      {mensagemSucesso && (
        <p role="status" className="correcao-aviso">
          {mensagemSucesso}
        </p>
      )}
      <MinhasPreGuiasPage onVisualizarECorrigir={(id) => navigate(`/pre-guias/${id}/corrigir`)} />
    </>
  );
}
