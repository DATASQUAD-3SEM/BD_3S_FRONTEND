import { useNavigate, useParams } from 'react-router-dom';
import CorrecaoPreGuiaPage from './CorrecaoPreGuiaPage';

/** Liga a rota /pre-guias/:id/corrigir à tela de correção. */
export default function CorrecaoPreGuiaRota() {
  const { id } = useParams();
  const navigate = useNavigate();
  const numero = Number(id);

  if (!Number.isInteger(numero) || numero <= 0) {
    return (
      <section className="correcao-pagina">
        <h1>Pré-guia não encontrada</h1>
      </section>
    );
  }

  return (
    <CorrecaoPreGuiaPage
      key={numero}
      id={numero}
      onVoltar={() => navigate('/pre-guias')}
      onNaoElegivel={() => navigate('/pre-guias')}
      onReenviado={(mensagem) => navigate('/pre-guias', { state: { mensagem } })}
    />
  );
}
