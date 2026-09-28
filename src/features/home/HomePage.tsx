import { Link } from 'react-router-dom'

export default function HomePage() {
  return (
    <>
      <h1>Nexus</h1>
      <p>Fluxo de trabalho do FUSEX: pre-guia, guia, lisura e glosa.</p>
      <div className="cards">
        <Link className="card" to="/pre-guias/nova">
          <h2>Nova pre-guia</h2>
          <p>Sprint 1 · em construcao</p>
        </Link>
        <Link className="card" to="/diagnostico/conexao">
          <h2>Testar conexao</h2>
          <p>Confere se o front esta falando com o backend.</p>
        </Link>
      </div>
    </>
  )
}
