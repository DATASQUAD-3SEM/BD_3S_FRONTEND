import { ApiError } from '../../shared/api/http';
import { formatarData, somenteDigitos } from '../../shared/utils/formatadores';
import type { PacienteDaLeitura } from './types';

/**
 * Conferencia da UG, da UG Origem e da validade da Guia no navegador (T16-FE). O servidor confere de novo
 * (T16-BE2); aqui o objetivo e bloquear o Concluir e explicar o motivo antes de enviar.
 */

/** UG do FUSEX para o qual o Nexus e desenvolvido: a unica aceita. */
export const UG_FUSEX = 'Cmdo Bda Inf Amv';

export const MSG_UG_VAZIA = 'Não foi possível ler a UG. Digite a UG impressa na Guia.';
export const MSG_UG_DE_OUTRO_FUSEX = `Esta Guia não é do FUSEX. A UG deve ser ${UG_FUSEX}.`;
export const MSG_UG_ORIGEM_DE_OUTRO_FUSEX =
  `A UG Origem impressa na Guia é diferente de ${UG_FUSEX}. Esta Guia não é do FUSEX.`;
export const MSG_VALIDADE_VAZIA = 'Não foi possível ler a validade. Digite a data impressa em NÃO RECEBER APÓS.';
export const MSG_VALIDADE_INVALIDA = 'Data inválida. Use o formato dd/mm/aaaa.';
export const MSG_CONFERENCIA_PENDENTE =
  'Não é possível concluir com a conferência pendente. Troque o arquivo ou corrija os campos.';

/** Sem espacos nas pontas, espacos repetidos reduzidos a um e sem diferenca de maiusculas. */
export function normalizarUg(valor: string): string {
  return valor.trim().replace(/\s+/g, ' ').toLowerCase();
}

export function ugEhDoFusex(valor: string): boolean {
  return normalizarUg(valor) === normalizarUg(UG_FUSEX);
}

/** Erro do campo "UG da Guia", ou null se ela esta correta. */
export function erroUg(ug: string): string | null {
  if (ug.trim() === '') return MSG_UG_VAZIA;
  return ugEhDoFusex(ug) ? null : MSG_UG_DE_OUTRO_FUSEX;
}

/** Erro da UG Origem lida do PDF. Se ela nao foi lida, nao bloqueia. */
export function erroUgOrigem(ugOrigemLida: string | null): string | null {
  if (ugOrigemLida === null || ugOrigemLida.trim() === '') return null;
  return ugEhDoFusex(ugOrigemLida) ? null : MSG_UG_ORIGEM_DE_OUTRO_FUSEX;
}

const doisDigitos = (n: number) => String(n).padStart(2, '0');

/** Data de hoje (calendario local) em yyyy-mm-dd. */
export function hojeIso(agora: Date = new Date()): string {
  return `${agora.getFullYear()}-${doisDigitos(agora.getMonth() + 1)}-${doisDigitos(agora.getDate())}`;
}

/** dd/mm/aaaa -> yyyy-mm-dd. Devolve null se o texto nao for uma data real. */
export function brParaIso(texto: string): string | null {
  const partes = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(texto.trim());
  if (!partes) return null;
  const [, dia, mes, ano] = partes;
  const data = new Date(Number(ano), Number(mes) - 1, Number(dia));
  const real =
    data.getFullYear() === Number(ano) && data.getMonth() === Number(mes) - 1 && data.getDate() === Number(dia);
  return real ? `${ano}-${mes}-${dia}` : null;
}

/** yyyy-mm-dd -> dd/mm/aaaa. Valor vazio vira texto vazio. */
export function isoParaBr(iso: string | null | undefined): string {
  return formatarData(iso);
}

/** Erro do campo de validade (texto dd/mm/aaaa), ou null se ela esta correta e nao venceu. */
export function erroValidade(validadeBr: string, hoje: string = hojeIso()): string | null {
  const texto = validadeBr.trim();
  if (texto === '') return MSG_VALIDADE_VAZIA;
  const iso = brParaIso(texto);
  if (iso === null) return MSG_VALIDADE_INVALIDA;
  if (iso < hoje) return `Esta Guia já venceu em ${texto}. Não é possível concluir.`;
  return null;
}

export interface EntradaConferencia {
  /** Valor do campo "UG da Guia". */
  ug: string;
  /** UG Origem lida do PDF (nao ha campo); null se nao foi lida. */
  ugOrigemLida: string | null;
  /** Valor do campo de validade, em dd/mm/aaaa. */
  validade: string;
}

export interface ErrosConferencia {
  ug: string | null;
  ugOrigem: string | null;
  validade: string | null;
}

/** Roda a conferencia completa: a UG Origem e conferida em segundo plano, sem campo proprio. */
export function conferirGuia({ ug, ugOrigemLida, validade }: EntradaConferencia, hoje?: string): ErrosConferencia {
  return { ug: erroUg(ug), ugOrigem: erroUgOrigem(ugOrigemLida), validade: erroValidade(validade, hoje) };
}

/** A UG Origem nao tem campo: o erro dela aparece abaixo do campo "UG da Guia". */
export function mensagemDoCampoUg(erros: ErrosConferencia): string | null {
  return erros.ug ?? erros.ugOrigem;
}

export function temErroDeConferencia(erros: ErrosConferencia): boolean {
  return erros.ug !== null || erros.ugOrigem !== null || erros.validade !== null;
}

/** Erros 422 do servidor sobre UG, UG Origem ou validade (T16-BE2), cada um com a mensagem sem o prefixo. */
export interface ErrosServidorConferencia {
  numeroGuia?: string;
  ug?: string;
  ugOrigem?: string;
  validadeAte?: string;
}

/** T22-FE1: 409 do servidor quando o numero ja pertence a outra Guia. */
export const MSG_NUMERO_JA_USADO =
  'Este número de Guia já foi usado em outra Guia. Confira o número impresso no PDF ou troque o arquivo.';

/**
 * Le os detalhes "campo: mensagem" de um 422 (UG, UG Origem ou validade) ou do 409 do numero ja usado em outra Guia.
 * Devolve null se o erro nao e sobre esses campos.
 */
export function errosDeConferenciaDoServidor(erro: unknown): ErrosServidorConferencia | null {
  if (!(erro instanceof ApiError)) return null;
  if (erro.status === 409) {
    return erro.detalhes.some((d) => d.startsWith('numeroGuia:')) ? { numeroGuia: MSG_NUMERO_JA_USADO } : null;
  }
  if (erro.status !== 422) return null;
  const erros: ErrosServidorConferencia = {};
  for (const linha of erro.detalhes) {
    const achado = /^(ug|ugOrigem|validadeAte):\s*(.*)$/.exec(linha);
    if (achado) erros[achado[1] as keyof ErrosServidorConferencia] = achado[2];
  }
  return Object.keys(erros).length > 0 ? erros : null;
}

/**
 * Conferencia do Prec CP do paciente (T21-FE / T21-BE1). O Prec CP lido do PDF e comparado (so digitos) com o
 * da pre-guia. `precCpConfere` true/false vem da leitura 200; null quando o Prec CP nao foi lido (ou a pre-guia
 * nao tem Prec CP) ou quando a leitura respondeu 422 (PDF sem numero). Nao bloqueia o Concluir quando null.
 */
export const MSG_PREC_CP_NAO_LIDO =
  'Não foi possível ler o Prec CP do paciente nesta Guia. Confira se ela é do paciente desta pré-guia antes de concluir.';

export interface MensagemConferenciaPaciente {
  estilo: 'ok' | 'erro' | 'aviso';
  texto: string;
}

/** Monta a mensagem do bloco do paciente conforme o resultado da conferencia do Prec CP. */
export function mensagemConferenciaPaciente(
  precCpConfere: boolean | null,
  precCpLido: string | null,
  precCpCadastrado: string,
  paciente?: PacienteDaLeitura | null,
): MensagemConferenciaPaciente {
  // T30-FE4: para paciente dependente, o Prec CP esperado é o do dependente (vem da leitura, T30-BE4).
  const dependente = paciente?.dependente === true;
  const cadastrado = somenteDigitos(dependente && paciente?.precCp ? paciente.precCp : precCpCadastrado);
  if (precCpConfere === true) {
    if (dependente) {
      return {
        estilo: 'ok',
        texto: `O Prec CP do paciente nesta Guia confere com o do dependente ${paciente?.nome ?? ''} da pré-guia.`,
      };
    }
    return { estilo: 'ok', texto: `O Prec CP do paciente confere com a pré-guia (${cadastrado}).` };
  }
  if (precCpConfere === false) {
    const lido = somenteDigitos(precCpLido ?? '');
    return {
      estilo: 'erro',
      texto: `O Prec CP do paciente nesta Guia (${lido}) é diferente do Prec CP da pré-guia (${cadastrado}). Esta Guia pode ser de outro paciente. Troque o arquivo.`,
    };
  }
  return { estilo: 'aviso', texto: MSG_PREC_CP_NAO_LIDO };
}
