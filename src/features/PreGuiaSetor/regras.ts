import { ApiError } from '../../shared/api/http';
import type { DetalhePreGuia } from './types';

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

/** Concluir só vale com PDF já gravado para o número que está no campo. */
export function podeConcluirGuia(detalhe: DetalhePreGuia, numeroDigitado: string): boolean {
  const numero = numeroDigitado.trim();
  return detalhe.guiaRascunho !== null && numero !== '' && numero === detalhe.guiaRascunho.numero;
}

export function ehPdf(arquivo: File): boolean {
  return arquivo.type === 'application/pdf' || arquivo.name.toLowerCase().endsWith('.pdf');
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
