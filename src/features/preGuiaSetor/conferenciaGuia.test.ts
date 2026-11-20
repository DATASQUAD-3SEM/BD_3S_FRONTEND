import { describe, expect, it } from 'vitest';
import { ApiError } from '../../shared/api/http';
import {
  brParaIso,
  conferirGuia,
  erroUg,
  erroUgOrigem,
  erroValidade,
  errosDeConferenciaDoServidor,
  hojeIso,
  isoParaBr,
  mensagemDoCampoUg,
  normalizarUg,
  temErroDeConferencia,
  ugEhDoFusex,
} from './conferenciaGuia';

/**
 * T16-FE: regras de conferencia de UG, UG Origem e validade (sem tela).
 */

describe('normalizarUg e ugEhDoFusex', () => {
  it('ignora maiúsculas, espaços nas pontas e espaços repetidos', () => {
    expect(normalizarUg('  CMDO   Bda  Inf Amv ')).toBe('cmdo bda inf amv');
    expect(ugEhDoFusex('Cmdo Bda Inf Amv')).toBe(true);
    expect(ugEhDoFusex('  cmdo   BDA inf amv  ')).toBe(true);
  });

  it('recusa qualquer outra UG', () => {
    expect(ugEhDoFusex('Cmdo Bda Inf Sul')).toBe(false);
    expect(ugEhDoFusex('Cmdo Bda Inf')).toBe(false);
    expect(ugEhDoFusex('')).toBe(false);
  });
});

describe('erroUg', () => {
  it('vazia pede para digitar a UG impressa', () => {
    expect(erroUg('')).toBe('Não foi possível ler a UG. Digite a UG impressa na Guia.');
    expect(erroUg('   ')).toBe('Não foi possível ler a UG. Digite a UG impressa na Guia.');
  });

  it('diferente da UG do FUSEX explica qual é a aceita', () => {
    expect(erroUg('Cmdo Bda Inf Sul')).toBe('Esta Guia não é do FUSEX. A UG deve ser Cmdo Bda Inf Amv.');
  });

  it('correta não tem erro', () => {
    expect(erroUg('Cmdo Bda Inf Amv')).toBeNull();
    expect(erroUg(' CMDO bda INF amv ')).toBeNull();
  });
});

describe('erroUgOrigem', () => {
  it('UG Origem não lida não bloqueia', () => {
    expect(erroUgOrigem(null)).toBeNull();
    expect(erroUgOrigem('')).toBeNull();
  });

  it('UG Origem lida diferente bloqueia', () => {
    expect(erroUgOrigem('Cmdo Bda Inf Sul')).toBe(
      'A UG Origem impressa na Guia é diferente de Cmdo Bda Inf Amv. Esta Guia não é do FUSEX.',
    );
  });

  it('UG Origem lida correta não tem erro', () => {
    expect(erroUgOrigem('Cmdo Bda Inf Amv')).toBeNull();
  });
});

describe('datas', () => {
  it('hojeIso usa o calendário local', () => {
    expect(hojeIso(new Date(2026, 10, 18, 23, 59))).toBe('2026-11-18');
    expect(hojeIso(new Date(2027, 0, 5))).toBe('2027-01-05');
  });

  it('brParaIso converte datas reais e recusa o resto', () => {
    expect(brParaIso('01/01/2027')).toBe('2027-01-01');
    expect(brParaIso('29/02/2028')).toBe('2028-02-29');
    expect(brParaIso('31/02/2027')).toBeNull();
    expect(brParaIso('29/02/2027')).toBeNull();
    expect(brParaIso('1/1/2027')).toBeNull();
    expect(brParaIso('2027-01-01')).toBeNull();
    expect(brParaIso('')).toBeNull();
  });

  it('isoParaBr converte e devolve vazio sem data', () => {
    expect(isoParaBr('2027-01-01')).toBe('01/01/2027');
    expect(isoParaBr(null)).toBe('');
    expect(isoParaBr(undefined)).toBe('');
  });
});

describe('erroValidade', () => {
  const hoje = '2026-11-18';

  it('vazia pede para digitar a data impressa em NÃO RECEBER APÓS', () => {
    expect(erroValidade('', hoje)).toBe('Não foi possível ler a validade. Digite a data impressa em NÃO RECEBER APÓS.');
  });

  it('data incompleta ou inexistente é inválida', () => {
    expect(erroValidade('01/01', hoje)).toBe('Data inválida. Use o formato dd/mm/aaaa.');
    expect(erroValidade('31/02/2027', hoje)).toBe('Data inválida. Use o formato dd/mm/aaaa.');
  });

  it('anterior a hoje venceu, e a mensagem traz a data', () => {
    expect(erroValidade('17/11/2026', hoje)).toBe('Esta Guia já venceu em 17/11/2026. Não é possível concluir.');
    expect(erroValidade('20/10/2026', hoje)).toBe('Esta Guia já venceu em 20/10/2026. Não é possível concluir.');
  });

  it('hoje e datas futuras não têm erro', () => {
    expect(erroValidade('18/11/2026', hoje)).toBeNull();
    expect(erroValidade('01/01/2027', hoje)).toBeNull();
  });
});

describe('conferirGuia', () => {
  const hoje = '2026-11-18';

  it('tudo certo: sem erro', () => {
    const erros = conferirGuia({ ug: 'Cmdo Bda Inf Amv', ugOrigemLida: 'Cmdo Bda Inf Amv', validade: '01/01/2027' }, hoje);
    expect(temErroDeConferencia(erros)).toBe(false);
    expect(mensagemDoCampoUg(erros)).toBeNull();
  });

  it('UG correta com UG Origem diferente: o erro da UG Origem aparece no campo UG', () => {
    const erros = conferirGuia({ ug: 'Cmdo Bda Inf Amv', ugOrigemLida: 'Cmdo Bda Inf Sul', validade: '01/01/2027' }, hoje);
    expect(erros.ug).toBeNull();
    expect(erros.ugOrigem).not.toBeNull();
    expect(temErroDeConferencia(erros)).toBe(true);
    expect(mensagemDoCampoUg(erros)).toBe(erros.ugOrigem);
  });

  it('o erro da UG tem prioridade sobre o da UG Origem no campo', () => {
    const erros = conferirGuia({ ug: 'Cmdo Bda Inf Sul', ugOrigemLida: 'Cmdo Bda Inf Sul', validade: '01/01/2027' }, hoje);
    expect(mensagemDoCampoUg(erros)).toBe(erros.ug);
  });
});

describe('errosDeConferenciaDoServidor', () => {
  it('lê ug, ugOrigem e validadeAte de um 422 sem o prefixo do campo', () => {
    const erro = new ApiError(422, 'Dados invalidos', [
      'ug: A Guia não é do FUSEX. A UG deve ser Cmdo Bda Inf Amv.',
      'validadeAte: Esta Guia já venceu em 15/01/2020. Não é possível concluir.',
    ]);
    expect(errosDeConferenciaDoServidor(erro)).toEqual({
      ug: 'A Guia não é do FUSEX. A UG deve ser Cmdo Bda Inf Amv.',
      validadeAte: 'Esta Guia já venceu em 15/01/2020. Não é possível concluir.',
    });
    expect(errosDeConferenciaDoServidor(new ApiError(422, 'x', ['ugOrigem: diferente']))).toEqual({ ugOrigem: 'diferente' });
  });

  it('ignora 422 de outros campos e erros que não são 422', () => {
    expect(errosDeConferenciaDoServidor(new ApiError(422, 'x', ['exames: Informe ao menos um exame']))).toBeNull();
    expect(errosDeConferenciaDoServidor(new ApiError(409, 'x', ['ug: qualquer']))).toBeNull();
    expect(errosDeConferenciaDoServidor(new Error('falha'))).toBeNull();
  });
});
