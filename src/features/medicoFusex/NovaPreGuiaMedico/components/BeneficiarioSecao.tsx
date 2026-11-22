import { formatarCpf } from '../../../../shared/utils/formatadores'
import { formatarPrecCp, formatarTelefone, mascaraPrecCp } from '../../../../shared/utils/formatadores'
import type { BeneficiarioBusca, DependenteMedico } from '../types'

/**
 * Secao "Beneficiario" da Nova pre-guia do medico: busca pelo Prec CP com mascara e exibe os dados
 * encontrados em um cartao somente leitura.
 */

export type StatusBusca = 'ocioso' | 'buscando' | 'encontrado' | 'naoEncontrado' | 'erro'

interface Props {
  precCp: string
  status: StatusBusca
  beneficiario: BeneficiarioBusca | null
  onPrecCpChange: (valor: string) => void
  onBuscar: () => void
}

/**
 * Aviso abaixo do cartão quando o paciente é um dependente (T30-FE5): quem recebe a Guia, envia à OCS e assina.
 * Um só responsável por menor (regra 13): o titular no menor sob sua guarda, o responsável legal externo no outro.
 */
export function avisoDoDependente(dependente: DependenteMedico): string {
  if (!dependente.menor) {
    return 'Dependente maior de idade. Quando a Guia for emitida, ela aparece para o próprio dependente, que a envia à OCS e assina as sessões.'
  }
  const quem = dependente.responsavel ?? dependente.titularNome
  if (quem === dependente.titularNome) {
    return `Paciente menor de idade. Quando a Guia for emitida, ela aparece para o titular, ${quem}, que a envia à OCS e assina as sessões.`
  }
  return `Paciente menor de idade. Quando a Guia for emitida, ela aparece para o responsável legal, ${quem}, que a envia à OCS e assina as sessões.`
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
      {
        rotulo: 'Faixa etária',
        valor: `${beneficiario.faixaEtaria} (${beneficiario.idade} anos)`,
      },
      { rotulo: 'CPF', valor: formatarCpf(beneficiario.cpf) },
      { rotulo: 'Telefone', valor: formatarTelefone(beneficiario.telefone) },
      ...(beneficiario.dependente
        ? [
          { rotulo: 'Paciente', valor: `Dependente${beneficiario.dependente.vinculo ? ` (${beneficiario.dependente.vinculo})` : ''}` },
          {
            rotulo: 'Titular',
            valor: `${beneficiario.dependente.titularNome} · Prec CP ${formatarPrecCp(beneficiario.dependente.titularPrecCp)}`,
          },
        ]
        : []),
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

      {status === 'encontrado' && beneficiario?.dependente && (
        <p className="npg-aviso" role="note">
          {avisoDoDependente(beneficiario.dependente)}
        </p>
      )}
    </section>
  )
}
