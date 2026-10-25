import type { Beneficiario } from '../../../../shared/types/domain'

import {
  calcularIdade,
} from '../../../beneficiario/calculosBeneficiario'

/**
 * Bloco somente leitura com os dados do beneficiario logado na Nova pre-guia (Sprint 1).
 */

interface Props {
  value: Beneficiario
}

/** 12345678900 -> 123.456.789-00 */
function formatarCpf(valor: string): string {
  const digitos = valor.replace(/\D/g, '').slice(0, 11)

  if (digitos.length !== 11) {
    return valor
  }

  return `${digitos.slice(0, 3)}.${digitos.slice(3, 6)}.${digitos.slice(6, 9)}-${digitos.slice(9)}`
}

/** 45872213300 -> 458722133-00 */
function formatarPrecCp(valor: string): string {
  const digitos = valor.replace(/\D/g, '')

  if (digitos.length !== 11) {
    return valor
  }

  return `${digitos.slice(0, 9)}-${digitos.slice(9)}`
}

/** Converte uma data ISO para DD/MM/AAAA. */
function formatarDataNascimento(
  data: string | null | undefined,
): string {
  if (!data) {
    return ''
  }

  const correspondencia = /^(\d{4})-(\d{2})-(\d{2})/.exec(data)

  if (!correspondencia) {
    return data
  }

  const [, ano, mes, dia] = correspondencia

  return `${dia}/${mes}/${ano}`
}

/** Deriva a faixa etária a partir da idade. */
function faixaEtaria(idade: number | null): string {
  if (idade === null || !Number.isFinite(idade)) {
    return ''
  }

  if (idade < 18) return 'Menor de 18'
  if (idade <= 30) return '18 a 30'
  if (idade <= 40) return '31 a 40'
  if (idade <= 50) return '41 a 50'
  if (idade <= 60) return '51 a 60'
  if (idade <= 70) return '61 a 70'

  return 'Acima de 70'
}

export default function DadosBeneficiario({ value }: Props) {
  const idade = calcularIdade(value.dataNascimento)

  const linhas: Array<{ rotulo: string; valor: string }> = [
    { rotulo: 'Beneficiário', valor: value.nome },
    { rotulo: 'Grupo', valor: value.grupo ?? '' },
    {
      rotulo: 'Data de nascimento',
      valor: formatarDataNascimento(value.dataNascimento),
    },
    {
      rotulo: 'Faixa etária',
      valor: faixaEtaria(idade),
    },
    {
      rotulo: 'Prec-CP',
      valor: formatarPrecCp(value.precCp),
    },
    {
      rotulo: 'CPF',
      valor: formatarCpf(value.cpf),
    },
    {
      rotulo: 'Idade',
      valor: idade === null ? '' : `${idade} anos`,
    },
    {
      rotulo: 'Telefone',
      valor: value.telefone ?? '',
    },
  ]

  return (
    <section className="painel painel-dados">
      <h2 className="painel-titulo">
        Dados do beneficiário
      </h2>

      <div className="dados-lista">
        {linhas.map((linha, i) => (
          <div
            className="dados-linha"
            data-par={i % 2 === 1 ? 'true' : 'false'}
            key={linha.rotulo}
          >
            <span className="dados-rotulo">
              {linha.rotulo}
            </span>

            <span className="dados-valor">
              {linha.valor || '—'}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}
