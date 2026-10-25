import type { BeneficiarioCorrecao } from '../correcaoTipos'
import { formatarPrecCp } from '../../../../shared/utils/formatadores'

interface Props {
  beneficiario: BeneficiarioCorrecao
}

export default function BeneficiarioCard({ beneficiario }: Props) {
  return (
    <section className="pgd__cartao" aria-labelledby="pgd-beneficiario">
      <h2 id="pgd-beneficiario">Beneficiário</h2>
      <dl className="pgd__dados">
        <div>
          <dt>Nome</dt>
          <dd>{beneficiario.nome}</dd>
        </div>
        <div>
          <dt>Prec CP</dt>
          <dd>{formatarPrecCp(beneficiario.precCp)}</dd>
        </div>
        <div>
          <dt>Faixa etária</dt>
          <dd>{beneficiario.faixaEtaria}</dd>
        </div>
        <div>
          <dt>Telefone</dt>
          <dd>{formatarTelefone(beneficiario.telefone)}</dd>
        </div>
      </dl>
      <p className="pgd__ajuda">
        O beneficiário não pode ser trocado. Para isso, crie uma nova pré-guia.
      </p>
    </section>
  )
}

function formatarTelefone(valor: string | null): string {
  if (!valor) return '—'
  const digitos = valor.replace(/\D/g, '')
  if (digitos.length === 11) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`
  if (digitos.length === 10) return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`
  return valor
}
