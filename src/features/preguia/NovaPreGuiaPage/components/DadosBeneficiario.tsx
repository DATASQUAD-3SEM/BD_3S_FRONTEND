import type { DadosBeneficiarioForm } from '../types'

interface Props {
  value: DadosBeneficiarioForm
}

/** 12345678900 -> 123.456.789-00 (formato so para exibicao). */
function formatarCpf(digitos: string): string {
  const d = digitos.replace(/\D/g, '').slice(0, 11)
  if (d.length !== 11) return digitos
  return `${d.slice(0, 3)}.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`
}

/** 45872213300 -> 458722133-00 (formato so para exibicao). */
function formatarPrecCp(digitos: string): string {
  const d = digitos.replace(/\D/g, '')
  if (d.length !== 11) return digitos
  return `${d.slice(0, 9)}-${d.slice(9)}`
}

/** Deriva a faixa etaria a partir da idade (só para exibicao). */
function faixaEtaria(idade: string): string {
  const n = Number.parseInt(idade, 10)
  if (!Number.isFinite(n)) return ''
  if (n < 18) return 'Menor de 18'
  if (n <= 30) return '18 a 30'
  if (n <= 40) return '31 a 40'
  if (n <= 50) return '41 a 50'
  if (n <= 60) return '51 a 60'
  if (n <= 70) return '61 a 70'
  return 'Acima de 70'
}

/**
 * Sprint 1: dados vem de `sessaoFake.ts` (nao ha login ainda). Somente leitura.
 * Sprint 2: `value` sera preenchido por `GET /beneficiarios/me` apos login.
 * Nao formatamos o value original: apenas a exibicao. `sessaoFake` continua
 * mandando digitos crus para o POST /pre-guias.
 */
export default function DadosBeneficiario({ value }: Props) {
  const linhas: Array<{ rotulo: string; valor: string }> = [
    { rotulo: 'Beneficiário', valor: value.nome },
    { rotulo: 'Grupo', valor: 'Exército Brasileiro · FUSEX' },
    { rotulo: 'Faixa etária', valor: faixaEtaria(value.idade) },
    { rotulo: 'Prec-CP', valor: formatarPrecCp(value.precCp) },
    { rotulo: 'CPF', valor: formatarCpf(value.cpf) },
    { rotulo: 'Idade', valor: value.idade ? `${value.idade} anos` : '' },
    { rotulo: 'Telefone', valor: value.telefone },
  ]

  return (
    <section className="painel painel-dados">
      <h2 className="painel-titulo">Dados do beneficiário</h2>
      <div className="dados-lista">
        {linhas.map((linha, i) => (
          <div className="dados-linha" data-par={i % 2 === 1 ? 'true' : 'false'} key={linha.rotulo}>
            <span className="dados-rotulo">{linha.rotulo}</span>
            <span className="dados-valor">{linha.valor || '—'}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
