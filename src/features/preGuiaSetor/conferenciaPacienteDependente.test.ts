import { describe, expect, it } from 'vitest';
import { MSG_PREC_CP_NAO_LIDO, mensagemConferenciaPaciente } from './conferenciaGuia';

/**
 * T30-FE4: conferência do Prec CP quando o paciente da pré-guia é um dependente. O Prec CP esperado é o do
 * dependente (precCpPaciente da leitura, T30-BE4), e não o do titular cadastrado na pré-guia.
 */
describe('T30-FE4 · conferência do Prec CP do dependente', () => {
  const titular = '45872213300';
  const miguel = { dependente: true, nome: 'Miguel Ferreira', precCp: '12345678902' };

  it('Prec CP do dependente confere: mensagem com o nome do dependente', () => {
    expect(mensagemConferenciaPaciente(true, '12345678902', titular, miguel)).toEqual({
      estilo: 'ok',
      texto: 'O Prec CP do paciente nesta Guia confere com o do dependente Miguel Ferreira da pré-guia.',
    });
  });

  it('Prec CP do titular numa Guia de dependente: erro mostra o Prec CP do dependente', () => {
    const resultado = mensagemConferenciaPaciente(false, titular, titular, miguel);

    expect(resultado.estilo).toBe('erro');
    expect(resultado.texto).toBe(
      'O Prec CP do paciente nesta Guia (45872213300) é diferente do Prec CP da pré-guia (12345678902). ' +
        'Esta Guia pode ser de outro paciente. Troque o arquivo.',
    );
  });

  it('Prec CP não lido: aviso da T21, como para o titular', () => {
    expect(mensagemConferenciaPaciente(null, null, titular, miguel)).toEqual({ estilo: 'aviso', texto: MSG_PREC_CP_NAO_LIDO });
  });

  it('pré-guia do titular: igual à T21', () => {
    const doTitular = { dependente: false, nome: 'Antonio Carlos', precCp: titular };
    expect(mensagemConferenciaPaciente(true, titular, titular, doTitular).texto).toBe(
      'O Prec CP do paciente confere com a pré-guia (45872213300).',
    );
    expect(mensagemConferenciaPaciente(true, titular, titular).texto).toBe(
      'O Prec CP do paciente confere com a pré-guia (45872213300).',
    );
  });
});
