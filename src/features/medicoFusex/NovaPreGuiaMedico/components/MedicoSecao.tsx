import type { MedicoSolicitante } from '../types'

interface Props {
  medico: MedicoSolicitante | null
  carregando: boolean
  erro: string | null
}

export default function MedicoSecao({ medico, carregando, erro }: Props) {
  return (
    <section className="npg-secao" aria-labelledby="npg-titulo-medico">
      <h2 id="npg-titulo-medico" className="npg-titulo">
        Médico solicitante
      </h2>

      {carregando && <p className="npg-aviso">Carregando seus dados...</p>}

      {erro && (
        <p className="erro" role="alert">
          {erro}
        </p>
      )}

      {medico && (
        <>
          <dl className="npg-card-leitura">
            <div className="npg-campo">
              <dt>Nome</dt>
              <dd>{`${medico.patente} ${medico.nome}`}</dd>
            </div>
            <div className="npg-campo">
              <dt>CRM</dt>
              <dd>{medico.crm}</dd>
            </div>
          </dl>
          <p className="npg-ajuda">Preenchido automaticamente com seu perfil.</p>
        </>
      )}
    </section>
  )
}
