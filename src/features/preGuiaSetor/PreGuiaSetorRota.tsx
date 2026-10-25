import { useNavigate, useParams } from 'react-router-dom';
import PreGuiaSetorPage from './PreGuiaSetorPage';

/** Liga a rota /setor-guias/pre-guias/:id à tela de detalhe. */
export default function PreGuiaSetorRota() {
  const { id } = useParams();
  const navigate = useNavigate();
  const numero = Number(id);

  if (!Number.isInteger(numero) || numero <= 0) {
    return (
      <section className="pgs pgs--centro">
        <h1>Pré-guia não encontrada</h1>
      </section>
    );
  }

  return (
    <PreGuiaSetorPage
      key={numero}
      id={numero}
      onVoltarFila={() => navigate('/setor-guias/fila')}
    />
  );
}
