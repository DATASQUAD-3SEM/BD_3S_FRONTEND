import { useNavigate } from 'react-router-dom';
import FilaPreGuiasPage from './FilaPreGuiasPage';

/** Liga o "Abrir" da fila à rota do detalhe da pré-guia (Tela 4) com o id. */
export default function FilaPreGuiasRota() {
  const navigate = useNavigate();
  return <FilaPreGuiasPage onAbrir={(id) => navigate(`/setor-guias/pre-guias/${id}`)} />;
}
