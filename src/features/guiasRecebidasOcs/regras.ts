import { somenteDigitos } from '../../shared/utils/formatadores';
import type { GuiaRecebida } from './types';

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
