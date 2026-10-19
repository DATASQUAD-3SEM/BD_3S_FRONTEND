interface PartesData {
  ano: number
  mes: number
  dia: number
}

/**
 * Lê uma data ISO, como "1968-05-10".
 * Também aceita uma data ISO com horário.
 * Devolve null se a data estiver ausente ou for inválida.
 */
function extrairPartesData(
  data: string | null | undefined,
): PartesData | null {
  if (!data) {
    return null
  }

  const correspondencia =
    /^(\d{4})-(\d{2})-(\d{2})(?:$|T)/.exec(data)

  if (!correspondencia) {
    return null
  }

  const ano = Number(correspondencia[1])
  const mes = Number(correspondencia[2])
  const dia = Number(correspondencia[3])

  const dataTeste = new Date(ano, mes - 1, dia)

  // Impede datas inexistentes, como 31 de fevereiro.
  if (
    dataTeste.getFullYear() !== ano ||
    dataTeste.getMonth() !== mes - 1 ||
    dataTeste.getDate() !== dia
  ) {
    return null
  }

  return { ano, mes, dia }
}

/**
 * Calcula a idade completa em anos.
 *
 * A idade só aumenta quando a pessoa faz aniversário.
 * Retorna null se a data não for válida ou estiver no futuro.
 */
export function calcularIdade(
  dataNascimento: string | null | undefined,
  hoje: Date = new Date(),
): number | null {
  const nascimento = extrairPartesData(dataNascimento)

  if (!nascimento || Number.isNaN(hoje.getTime())) {
    return null
  }

  const { ano, mes, dia } = nascimento

  let idade = hoje.getFullYear() - ano

  const jaFezAniversario =
    hoje.getMonth() + 1 > mes ||
    (
      hoje.getMonth() + 1 === mes &&
      hoje.getDate() >= dia
    )

  if (!jaFezAniversario) {
    idade--
  }

  return idade < 0 ? null : idade
}

/**
 * Converte uma idade em sua faixa etária.
 */
export function faixaEtaria(
  idade: number | null,
): string {
  if (
    idade === null ||
    !Number.isFinite(idade) ||
    idade < 0
  ) {
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

/**
 * Converte "1968-05-10" em "10/05/1968".
 */
export function formatarDataNascimento(
  dataNascimento: string | null | undefined,
): string {
  const partes = extrairPartesData(dataNascimento)

  if (!partes) {
    return ''
  }

  const dia = String(partes.dia).padStart(2, '0')
  const mes = String(partes.mes).padStart(2, '0')

  return `${dia}/${mes}/${partes.ano}`
}

/**
 * Produz a apresentação completa:
 * "10/05/1968 (58 anos)".
 */
export function formatarDataNascimentoComIdade(
  dataNascimento: string | null | undefined,
): string {
  const dataFormatada = formatarDataNascimento(dataNascimento)

  if (!dataFormatada) {
    return '—'
  }

  const idade = calcularIdade(dataNascimento)

  if (idade === null) {
    return dataFormatada
  }

  const sufixo = idade === 1 ? 'ano' : 'anos'

  return `${dataFormatada} (${idade} ${sufixo})`
}
