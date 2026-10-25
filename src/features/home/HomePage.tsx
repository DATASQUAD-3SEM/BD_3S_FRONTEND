import { Link, useNavigate } from 'react-router-dom'
import { entrarComo, INICIO_PERFIL, ROTULO_PERFIL, type Perfil } from '../../shared/layout/perfis'

const PERFIS: { perfil: Perfil; descricao: string }[] = [
  { perfil: 'BENEFICIARIO', descricao: 'Cria e acompanha as pré-guias e baixa as Guias.' },
  { perfil: 'MEDICO', descricao: 'Cria pré-guias na consulta, corrige as devolvidas e assina Guias.' },
  { perfil: 'CHEFE_FUSEX', descricao: 'Assina Guias e gerencia beneficiários e médicos.' },
  { perfil: 'SETOR_GUIAS', descricao: 'Analisa as pré-guias e anexa as Guias do SIRE.' },
  { perfil: 'RECEPCAO', descricao: 'Imprime Guias concluídas para quem está sem o app.' },
]

/**
 * Início geral: enquanto não há tela de login, escolhe com qual conta de exemplo (seed) entrar.
 * Cada perfil abre a própria área, com o layout e o menu do T0-FE.
 */
export default function HomePage() {
  const navigate = useNavigate()

  function entrar(perfil: Perfil) {
    entrarComo(perfil)
    navigate(INICIO_PERFIL[perfil])
  }

  return (
    <main className="app-main">
      <h1>Nexus</h1>
      <p>Fluxo de trabalho do FUSEX: pré-guia, Guia e assinaturas. Escolha o perfil para entrar.</p>
      <div className="cards">
        {PERFIS.map(({ perfil, descricao }) => (
          <button key={perfil} type="button" className="card card-botao" onClick={() => entrar(perfil)}>
            <h2>{ROTULO_PERFIL[perfil]}</h2>
            <p>{descricao}</p>
          </button>
        ))}
        <Link className="card" to="/diagnostico/conexao">
          <h2>Testar conexão</h2>
          <p>Confere se o front está falando com o backend.</p>
        </Link>
      </div>
    </main>
  )
}
