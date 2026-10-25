import { formatarCpf } from '../../formatadores'
import { formatarTelefone, mascaraPrecCp } from '../formatadores'
import type { BeneficiarioBusca } from '../types'

export type StatusBusca = 'ocioso' | 'buscando' | 'encontrado' | 'naoEncontrado' | 'erro'

interface Props {
  precCp: string
  status: StatusBusca
  beneficiario: BeneficiarioBusca | null
  onPrecCpChange: (valor: string) => void
  onBuscar: () => void
}

export default function BeneficiarioSecao({
                                            precCp,
                                            status,
                                            beneficiario,
                                            onPrecCpChange,
                                            onBuscar,
                                          }: Props) {
  const precCpCompleto = precCp.replace(/\D/g, '').length === 11
  const buscando = status === 'buscando'

  const linhas = beneficiario
    ? [
      { rotulo: 'Nome', valor: beneficiario.nome },
      { rotulo: 'Grupo', valor: beneficiario.grupo },
      {
        rotulo: 'Faixa etária',
        valor: `${beneficiario.faixaEtaria} (${beneficiario.idade} anos)`,
      },
      { rotulo: 'CPF', valor: formatarCpf(beneficiario.cpf) },
      { rotulo: 'Telefone', valor: formatarTelefone(beneficiario.telefone) },
    ]
    : []

  return (
    <section className="npg-secao" aria-labelledby="npg-titulo-beneficiario">
      <h2 id="npg-titulo-beneficiario" className="npg-titulo">
        Beneficiário
      </h2>

      <label htmlFor="npg-prec-cp" className="npg-rotulo">
        Prec CP
      </label>

      <div className="npg-linha-busca">
        <input
          id="npg-prec-cp"
          className="npg-input"
          inputMode="numeric"
          placeholder="000000000-00"
          value={precCp}
          onChange={(e) => onPrecCpChange(mascaraPrecCp(e.target.value))}
        />

        <button
          type="button"
          onClick={onBuscar}
          disabled={!precCpCompleto || buscando}
        >
          {buscando ? 'Buscando...' : 'Buscar'}
        </button>
      </div>

      {status === 'naoEncontrado' && (
        <p className="npg-aviso" role="status">
          Beneficiário não encontrado.
        </p>
      )}

      {status === 'erro' && (
        <div className="erro" role="alert">
          <p>Não foi possível buscar o beneficiário. Verifique a conexão e tente novamente.</p>
          <button type="button" onClick={onBuscar}>
            Tentar novamente
          </button>
        </div>
      )}

      {status === 'encontrado' && beneficiario && (
        <dl className="npg-card-leitura">
          {linhas.map((linha) => (
            <div className="npg-campo" key={linha.rotulo}>
              <dt>{linha.rotulo}</dt>
              <dd>{linha.valor}</dd>
            </div>
          ))}
        </dl>
      )}
    </section>
  )
}
