import { formatarCpf, formatarPrecCp } from '../../../../shared/utils/formatadores'
import type { MedicoSolicitante } from '../types'

/**
 * Secao "Medico solicitante" (T34-FE1): Nome, Patente, CRM, CPF e Prec CP preenchidos automaticamente com o perfil do
 * medico logado (regra 2, rota 2). Valor vazio mostra "—".
 */

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
            {[
              { rotulo: 'Nome', valor: medico.nome },
              { rotulo: 'Patente', valor: medico.patente },
              { rotulo: 'CRM', valor: medico.crm },
              { rotulo: 'CPF', valor: medico.cpf?.trim() ? formatarCpf(medico.cpf) : '' },
              { rotulo: 'Prec CP', valor: medico.precCp?.trim() ? formatarPrecCp(medico.precCp) : '' },
            ].map((campo) => (
              <div className="npg-campo" key={campo.rotulo}>
                <dt>{campo.rotulo}</dt>
                <dd>{campo.valor || '—'}</dd>
              </div>
            ))}
          </dl>
          <p className="npg-ajuda">Preenchido automaticamente com seu perfil.</p>
        </>
      )}
    </section>
  )
}
