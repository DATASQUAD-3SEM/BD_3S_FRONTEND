import { ApiError } from '../../shared/api/http';
import type { ExameGuia, ExameLidoNaGuia, ExameParaLinha } from './types';

/**
 * Lista "Exames na Guia" do Setor de Guias (T22-FE1): linhas editaveis, validacao no navegador e
 * conversao para o formato enviado ao PUT do rascunho (T22-BE1).
 */

/** Linha da tabela. Os campos ficam como digitados; a conversao acontece ao enviar. */
export interface LinhaExame {
  chave: number;
  codDgp: string;
  descricao: string;
  quantidade: string;
  /** O funcionario mexeu na linha: so entao os erros dela aparecem. */
  tocada: boolean;
}

export interface ErrosLinha {
  codDgp?: string;
  descricao?: string;
  quantidade?: string;
}

export const MSG_COD_DGP = 'Informe o Cod DGP da Guia (só números, até 10 dígitos).';
export const MSG_DESCRICAO = 'Informe a descrição do exame.';
export const MSG_DESCRICAO_LIMITE = 'A descrição deve ter no máximo 500 caracteres.';
export const MSG_QUANTIDADE = 'A quantidade deve ser um número inteiro maior que zero.';
export const MSG_QUANTIDADE_LIMITE = 'A quantidade deve ser no máximo 999.';
export const MSG_COD_REPETIDO = 'Este código já está na lista. Some as quantidades numa linha só.';
export const MSG_LISTA_VAZIA = 'Informe ao menos um exame da Guia.';
export const MSG_NAO_LIDO = 'Não foi possível ler os exames desta Guia. Digite os exames impressos na Guia.';
export const MSG_EXAMES_PENDENTES = 'Corrija os exames destacados na tabela para concluir.';
export const MSG_ATENCAO = 'Atenção: Confira os exames antes de concluir.';

const DESCRICAO_MAXIMA = 500;
const QUANTIDADE_MAXIMA = 999;

let proximaChave = 1;

/**
 * Linha nova. Sem campos preenchidos, nao mostra erro ate ser tocada. Linha que vem de um exame (lido do PDF ou
 * gravado) ja mostra os erros, para o setor ver, por exemplo, um codigo repetido impresso na Guia.
 */
export function novaLinha(exame?: ExameParaLinha): LinhaExame {
  return {
    chave: proximaChave++,
    codDgp: exame?.codDgp ?? '',
    descricao: exame?.descricao ?? '',
    quantidade: exame?.quantidade != null ? String(exame.quantidade) : '',
    tocada: exame !== undefined,
  };
}

/** Lista inicial a partir dos exames lidos ou gravados. Sem exames, abre uma linha vazia. */
export function linhasDeExames(exames: ExameParaLinha[] = []): LinhaExame[] {
  return exames.length > 0 ? exames.map((e) => novaLinha(e)) : [novaLinha()];
}

/** T21-BE1: converte os exames lidos do PDF (codigo) para o formato das linhas (codDgp). */
export function examesDaLeitura(lidos: ExameLidoNaGuia[] = []): ExameParaLinha[] {
  return lidos.map((e) => ({ codDgp: e.codigo ?? '', descricao: e.descricao ?? '', quantidade: e.quantidade }));
}

/** Erros de uma linha. Os codigos repetidos so acusam a partir da segunda ocorrencia. */
export function errosDaLinha(linha: LinhaExame, linhas: LinhaExame[]): ErrosLinha {
  const erros: ErrosLinha = {};

  const codigo = linha.codDgp.trim();
  if (!/^[0-9]{1,10}$/.test(codigo)) {
    erros.codDgp = MSG_COD_DGP;
  } else if (linhas.findIndex((o) => o.codDgp.trim() === codigo) !== linhas.indexOf(linha)) {
    erros.codDgp = MSG_COD_REPETIDO;
  }

  const descricao = linha.descricao.trim();
  if (descricao === '') erros.descricao = MSG_DESCRICAO;
  else if (descricao.length > DESCRICAO_MAXIMA) erros.descricao = MSG_DESCRICAO_LIMITE;

  const quantidade = linha.quantidade.trim();
  if (!/^[0-9]+$/.test(quantidade) || Number(quantidade) < 1) erros.quantidade = MSG_QUANTIDADE;
  else if (Number(quantidade) > QUANTIDADE_MAXIMA) erros.quantidade = MSG_QUANTIDADE_LIMITE;

  return erros;
}

/** A lista pode ser enviada: ao menos uma linha e nenhuma com erro (inclusive linha em branco). */
export function examesValidos(linhas: LinhaExame[]): boolean {
  return linhas.length > 0 && linhas.every((l) => Object.keys(errosDaLinha(l, linhas)).length === 0);
}

/** Formato do PUT do rascunho: texto sem espacos nas pontas e quantidade como numero. */
export function paraExamesGuia(linhas: LinhaExame[]): ExameGuia[] {
  return linhas.map((l) => ({
    codDgp: l.codDgp.trim(),
    descricao: l.descricao.trim(),
    quantidade: Number(l.quantidade.trim()),
  }));
}

/** Compara a tabela com o que ja esta gravado no rascunho. */
export function examesIguaisAoSalvo(linhas: LinhaExame[], salvos: ExameGuia[]): boolean {
  return JSON.stringify(paraExamesGuia(linhas)) === JSON.stringify(salvos);
}

/** Erro 422 do PUT apontando o campo exames (T22-BE1). */
export function erroDeExames(erro: unknown): boolean {
  return erro instanceof ApiError && erro.status === 422 && erro.detalhes.some((d) => d.startsWith('exames:'));
}
