import { somenteDigitos } from '../../shared/utils/formatadores';
import type { GuiaRecebida, SessaoRecebida, SituacaoSessaoOcs } from './types';

/**
 * Busca da lista "Guias recebidas" (T19-FE-1): nome, numero da guia ou Prec CP.
 * O texto e comparado sem diferenca de maiusculas; o Prec CP, pelos digitos (com ou sem traco).
 */
export function filtrarGuias(guias: GuiaRecebida[], termo: string): GuiaRecebida[] {
  const texto = termo.trim().toLowerCase();
  if (texto === '') return guias;

  const digitos = somenteDigitos(texto);
  return guias.filter(
    (guia) =>
      guia.beneficiario.nome.toLowerCase().includes(texto) ||
      guia.numero.includes(texto) ||
      (digitos !== '' && somenteDigitos(guia.beneficiario.precCp).includes(digitos)),
  );
}

/** Data de hoje no fuso local, em AAAA-MM-DD (mesmo formato de validadeAte). */
export function hojeIso(agora: Date = new Date()): string {
  const mes = String(agora.getMonth() + 1).padStart(2, '0');
  const dia = String(agora.getDate()).padStart(2, '0');
  return `${agora.getFullYear()}-${mes}-${dia}`;
}

/**
 * Guia vencida: hoje passou da data NAO RECEBER APOS. A mesma regra do backend (hoje.isAfter(validadeAte)).
 * Com a guia vencida, nenhuma sessao pode ser requerida.
 */
export function guiaVencida(validadeAte: string, hoje: string = hojeIso()): boolean {
  return hoje > validadeAte;
}

/** Uma sessao so pode ser selecionada se estiver disponivel e a guia nao estiver vencida. */
export function sessaoSelecionavel(sessao: SessaoRecebida, vencida: boolean): boolean {
  return !vencida && sessao.status === 'DISPONIVEL';
}

/** Sessoes de um procedimento (pelo Cod DGP), na ordem do numero. */
export function sessoesDoProcedimento(sessoes: SessaoRecebida[], codDgp: string): SessaoRecebida[] {
  return sessoes.filter((s) => s.procedimento === codDgp).sort((a, b) => a.numero - b.numero);
}

/** Rotulo da situacao da sessao, usado no texto alternativo e na legenda. */
export const ROTULO_SESSAO: Record<SituacaoSessaoOcs, string> = {
  DISPONIVEL: 'Disponível',
  SOLICITADA: 'Solicitada',
  ASSINADA: 'Assinada',
  EXPIRADA: 'Expirada',
};

/** Cor da casela da sessao: verde assinada, amarela solicitada, branca disponivel, cinza riscada expirada (regra 7.2). */
export const CLASSE_SESSAO: Record<SituacaoSessaoOcs, string> = {
  DISPONIVEL: 'gr-sessao--disponivel',
  SOLICITADA: 'gr-sessao--solicitada',
  ASSINADA: 'gr-sessao--assinada',
  EXPIRADA: 'gr-sessao--expirada',
};