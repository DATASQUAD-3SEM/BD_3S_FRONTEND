import { ApiError } from '../../shared/api/http';
import type { DetalhePreGuia } from './types';

/**
 * Regras de exibicao do detalhe da pre-guia: quando as colunas de decisao ficam ativas, quando o
 * botao Concluir habilita e como ler os erros 404 e 409 da API.
 */

export const LIMITE_OBSERVACAO = 500;

const MSG_CONFLITO = 'Esta pré-guia já foi alterada. Atualizamos a tela para mostrar a situação atual.';

export type SituacaoDecisao = 'ativa' | 'aguardando-correcao' | 'guia-enviada' | 'indisponivel';

/** Diz o que o cartão "Decisão do setor" deve mostrar. */
export function situacaoDecisao(detalhe: DetalhePreGuia): SituacaoDecisao {
  if (detalhe.guiaConcluida || detalhe.status === 'CONCLUIDA') return 'guia-enviada';
  if (detalhe.status === 'ATENCAO') return 'aguardando-correcao';
  if (detalhe.status === 'EM_ANALISE') return 'ativa';
  return 'indisponivel';
}

export const TAMANHO_MAXIMO_PDF_BYTES = 10 * 1024 * 1024; // 10 MB

export interface SituacaoGuia {
  numero: string;
  /** PDF escolhido nesta sessao e ainda nao enviado. */
  arquivoNovo: boolean;
  rascunho: DetalhePreGuia['guiaRascunho'];
}

/**
 * Concluir exige numero preenchido e um PDF para enviar agora ou um rascunho salvo com o mesmo numero.
 */
export function podeConcluirGuia({ numero, arquivoNovo, rascunho }: SituacaoGuia): boolean {
  const numeroPreenchido = numero.trim() !== '';
  return numeroPreenchido && (arquivoNovo || (rascunho !== null && numero.trim() === rascunho.numero));
}

/** Extensao .pdf e conteudo comecando com %PDF. */
export async function ehPdf(arquivo: File): Promise<boolean> {
  if (!arquivo.name.toLowerCase().endsWith('.pdf')) return false;
  return (await arquivo.slice(0, 4).text()) === '%PDF';
}

/** Devolve a mensagem de erro do PDF da Guia, ou null se ele pode ser lido. */
export async function validarPdfGuia(arquivo: File): Promise<string | null> {
  if (!(await ehPdf(arquivo))) return 'Arquivo inválido. Envie um PDF.';
  if (arquivo.size > TAMANHO_MAXIMO_PDF_BYTES) return 'O PDF passa de 10 MB. Envie um arquivo menor.';
  return null;
}

export function ehNaoEncontrada(erro: unknown): boolean {
  return erro instanceof ApiError && erro.status === 404;
}

export interface OpcoesMensagemErro {
  padrao: string;
  conflito?: string;
}

/** Converte erro da API em texto para o usuário. 409 vira o aviso de "já foi alterada". */
export function mensagemDeErro(erro: unknown, { padrao, conflito = MSG_CONFLITO }: OpcoesMensagemErro): string {
  if (!(erro instanceof ApiError)) return padrao;
  if (erro.status === 409) return conflito;
  if (erro.status === 422 && erro.detalhes.length > 0) {
    // o backend manda "campo: mensagem"; mostramos só a mensagem
    return erro.detalhes.map((linha) => linha.replace(/^[^:]+:\s*/, '')).join(' ');
  }
  return erro.message || padrao;
}
