import { describe, it, expect } from 'vitest';
import { ApiError } from '../../shared/api/http';
import {
  MSG_COD_DGP,
  MSG_COD_REPETIDO,
  MSG_DESCRICAO,
  MSG_DESCRICAO_LIMITE,
  MSG_QUANTIDADE,
  MSG_QUANTIDADE_LIMITE,
  errosDaLinha,
  erroDeExames,
  examesIguaisAoSalvo,
  examesValidos,
  linhasDeExames,
  novaLinha,
  paraExamesGuia,
  type LinhaExame,
} from './examesGuia';

/** Testes das regras da lista de exames da Guia (T22-FE1). */

const linha = (campos: Partial<Omit<LinhaExame, 'chave' | 'tocada'>> = {}): LinhaExame => ({
  ...novaLinha(),
  codDgp: '41001109',
  descricao: 'TC - Abdome superior',
  quantidade: '1',
  ...campos,
});

describe('linhasDeExames', () => {
  it('sem exames lidos ou gravados, abre uma linha vazia', () => {
    const linhas = linhasDeExames([]);
    expect(linhas).toHaveLength(1);
    expect(linhas[0]).toMatchObject({ codDgp: '', descricao: '', quantidade: '', tocada: false });
  });

  it('converte os exames em linhas preenchidas, na mesma ordem', () => {
    const linhas = linhasDeExames([
      { codDgp: '41001109', descricao: 'TC', quantidade: 1 },
      { codDgp: '41001110', descricao: 'Ultrassom', quantidade: 2 },
    ]);
    expect(linhas.map((l) => [l.codDgp, l.descricao, l.quantidade])).toEqual([
      ['41001109', 'TC', '1'],
      ['41001110', 'Ultrassom', '2'],
    ]);
  });
});

describe('errosDaLinha', () => {
  it('linha valida não tem erro', () => {
    const l = linha();
    expect(errosDaLinha(l, [l])).toEqual({});
  });

  it('código precisa ser só dígitos, de 1 a 10', () => {
    for (const cod of ['', '41a', '12345678901']) {
      const l = linha({ codDgp: cod });
      expect(errosDaLinha(l, [l]).codDgp).toBe(MSG_COD_DGP);
    }
  });

  it('descrição vazia ou só com espaços é erro; mais de 500 caracteres também', () => {
    const vazia = linha({ descricao: '   ' });
    expect(errosDaLinha(vazia, [vazia]).descricao).toBe(MSG_DESCRICAO);
    const longa = linha({ descricao: 'T'.repeat(501) });
    expect(errosDaLinha(longa, [longa]).descricao).toBe(MSG_DESCRICAO_LIMITE);
  });

  it('quantidade precisa ser inteira maior que zero, até 999', () => {
    for (const q of ['', '0', '-1', '1.5', 'abc']) {
      const l = linha({ quantidade: q });
      expect(errosDaLinha(l, [l]).quantidade).toBe(MSG_QUANTIDADE);
    }
    const alta = linha({ quantidade: '1000' });
    expect(errosDaLinha(alta, [alta]).quantidade).toBe(MSG_QUANTIDADE_LIMITE);
    const limite = linha({ quantidade: '999' });
    expect(errosDaLinha(limite, [limite]).quantidade).toBeUndefined();
  });

  it('código repetido acusa a partir da segunda ocorrência', () => {
    const primeira = linha();
    const segunda = linha({ descricao: 'Outro' });
    const linhas = [primeira, segunda];
    expect(errosDaLinha(primeira, linhas).codDgp).toBeUndefined();
    expect(errosDaLinha(segunda, linhas).codDgp).toBe(MSG_COD_REPETIDO);
  });
});

describe('examesValidos', () => {
  it('lista vazia não é válida', () => {
    expect(examesValidos([])).toBe(false);
  });

  it('linha em branco torna a lista inválida, mesmo sem mensagem na tela', () => {
    const boa = linha();
    expect(examesValidos([boa, novaLinha()])).toBe(false);
  });

  it('uma ou mais linhas válidas e sem repetição são aceitas', () => {
    const a = linha();
    const b = linha({ codDgp: '41001110' });
    expect(examesValidos([a, b])).toBe(true);
  });
});

describe('paraExamesGuia', () => {
  it('remove espaços das pontas e converte a quantidade em número', () => {
    const linhas = [linha({ codDgp: ' 41001109 ', descricao: '  TC  ', quantidade: ' 2 ' })];
    expect(paraExamesGuia(linhas)).toEqual([{ codDgp: '41001109', descricao: 'TC', quantidade: 2 }]);
  });
});

describe('examesIguaisAoSalvo', () => {
  it('compara a tabela com o rascunho gravado', () => {
    const salvos = [{ codDgp: '41001109', descricao: 'TC', quantidade: 1 }];
    expect(examesIguaisAoSalvo([linha({ descricao: 'TC', quantidade: '1' })], salvos)).toBe(true);
    expect(examesIguaisAoSalvo([linha({ descricao: 'TC', quantidade: '2' })], salvos)).toBe(false);
  });
});

describe('erroDeExames', () => {
  it('reconhece só o 422 que aponta o campo exames', () => {
    expect(erroDeExames(new ApiError(422, 'Dados invalidos', ['exames: Cod DGP repetido']))).toBe(true);
    expect(erroDeExames(new ApiError(422, 'Dados invalidos', ['pdf: Anexe o PDF']))).toBe(false);
    expect(erroDeExames(new ApiError(409, 'conflito'))).toBe(false);
  });
});
