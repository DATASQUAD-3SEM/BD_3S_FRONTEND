import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import PreGuiaSetorPage from './PreGuiaSetorPage';
import { criarMockPreGuiaSetor } from './api.mock';
import { MSG_CONFERENCIA_PENDENTE } from './conferenciaGuia';

/**
 * T21-FE: conferencia do Prec CP do paciente no bloco "Gerar a Guia". O Prec CP lido do PDF e comparado
 * (so digitos) com o da pre-guia; diferente bloqueia o Concluir, nao lido apenas avisa. Os PDFs de cenario
 * do prototipo ("guia-ok", "guia-outro-paciente", "guia-sem-prec-cp", "guia-dependente") escolhem o retorno.
 *
 * A pre-guia 0411 (id 11) tem como paciente Marta Souza Lima, Prec CP 45810020001.
 */

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:teste');
  URL.revokeObjectURL = vi.fn();
});

// "guia-ok" usa validade fixa do prototipo: congela a data de hoje (18/11/2026) para o resultado nao depender
// do dia em que o teste roda.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 18, 12));
});
afterEach(() => {
  vi.useRealTimers();
});

const mockApi = () => criarMockPreGuiaSetor({ atrasoMs: 0 });
const pdf = (nome: string) => new File(['%PDF-1.4'], nome, { type: 'application/pdf' });

const PREC_CP = '45810020001';
const MSG_CONFERE = `O Prec CP do paciente confere com a pré-guia (${PREC_CP}).`;
const MSG_DIFERENTE = `O Prec CP do paciente nesta Guia (99999999999) é diferente do Prec CP da pré-guia (${PREC_CP}). Esta Guia pode ser de outro paciente. Troque o arquivo.`;
const MSG_NAO_LIDO =
  'Não foi possível ler o Prec CP do paciente nesta Guia. Confira se ela é do paciente desta pré-guia antes de concluir.';

const seletorPdf = () => screen.getByLabelText('Escolher PDF da Guia');
const botaoConcluir = () => screen.getByRole('button', { name: 'Concluir' });

const anexarPdf = async (usuario: ReturnType<typeof userEvent.setup>, nome: string) => {
  await usuario.upload(seletorPdf(), pdf(nome));
  await screen.findByText('PDF anexado');
};

const abrir = async (api = mockApi()) => {
  render(<PreGuiaSetorPage id={11} api={api} />);
  await screen.findByRole('button', { name: 'Concluir' });
  return api;
};

describe('T21-FE · Conferência do Prec CP do paciente', () => {
  it('Prec CP igual mostra a mensagem de confere e Concluir segue habilitado', async () => {
    const usuario = userEvent.setup();
    await abrir();
    await anexarPdf(usuario, 'guia-ok.pdf');

    expect(screen.getByText(MSG_CONFERE)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(botaoConcluir()).toBeEnabled();
  });

  it('Prec CP diferente mostra o erro, bloqueia o Concluir e mostra a mensagem de conferência pendente', async () => {
    const usuario = userEvent.setup();
    await abrir();
    await anexarPdf(usuario, 'guia-outro-paciente.pdf');

    expect(screen.getByRole('alert')).toHaveTextContent(MSG_DIFERENTE);
    expect(botaoConcluir()).toBeDisabled();
    expect(screen.getByText(MSG_CONFERENCIA_PENDENTE)).toBeInTheDocument();
  });

  it('trocar por uma Guia do paciente certo libera o Concluir', async () => {
    const usuario = userEvent.setup();
    await abrir();
    await anexarPdf(usuario, 'guia-outro-paciente.pdf');
    expect(botaoConcluir()).toBeDisabled();

    await usuario.click(screen.getByRole('button', { name: 'Trocar arquivo' }));
    await usuario.upload(seletorPdf(), pdf('guia-ok.pdf'));
    await screen.findByText(MSG_CONFERE);

    expect(screen.queryByText(MSG_DIFERENTE)).not.toBeInTheDocument();
    expect(botaoConcluir()).toBeEnabled();
  });

  it('Prec CP não lido mostra o aviso e não bloqueia o Concluir', async () => {
    const usuario = userEvent.setup();
    await abrir();
    await anexarPdf(usuario, 'guia-sem-prec-cp.pdf');

    expect(screen.getByText(MSG_NAO_LIDO)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(botaoConcluir()).toBeEnabled();
  });

  it('PDF de dependente lê o Prec CP do dependente (o paciente) e confere', async () => {
    const usuario = userEvent.setup();
    await abrir();
    await anexarPdf(usuario, 'guia-dependente.pdf');

    expect(screen.getByText(MSG_CONFERE)).toBeInTheDocument();
    expect(screen.getByDisplayValue('50011015')).toBeInTheDocument();
    expect(botaoConcluir()).toBeEnabled();
  });

  it('Prec CP com formatação diferente da cadastrada conta como igual', async () => {
    const usuario = userEvent.setup();
    const api = mockApi();
    vi.spyOn(api, 'extrairNumeroGuia').mockResolvedValueOnce({
      numeroGuia: '202610678',
      exames: [{ codDgp: '41001109', descricao: 'TC - Abdome superior', quantidade: 1 }],
      ug: 'Cmdo Bda Inf Amv',
      ugOrigem: 'Cmdo Bda Inf Amv',
      validadeAte: '2027-01-01',
      precCpLido: '458.100.200-01',
      precCpConfere: true,
    });
    await abrir(api);
    await anexarPdf(usuario, 'guia-ok.pdf');

    expect(screen.getByText(MSG_CONFERE)).toBeInTheDocument();
    expect(botaoConcluir()).toBeEnabled();
  });

  it('422 (PDF sem número) mostra o aviso de Prec CP não lido, sem bloquear por ele', async () => {
    const usuario = userEvent.setup();
    await abrir();
    await usuario.upload(seletorPdf(), pdf('Guia_sem-numero.pdf'));
    await screen.findByText('Não foi possível ler o número automaticamente. Digite o número da Guia.');

    expect(screen.getByText(MSG_NAO_LIDO)).toBeInTheDocument();
    // o Concluir fica desabilitado pela falta de número/exames/UG, não pelo Prec CP não lido
    expect(botaoConcluir()).toBeDisabled();
  });

  it('429 e 500 não mostram mensagem nova do bloco do paciente', async () => {
    const usuario = userEvent.setup();
    await abrir();
    await usuario.upload(seletorPdf(), pdf('Guia_limite.pdf'));
    await screen.findByText('Muitas tentativas de leitura. Aguarde um instante e tente novamente.');

    expect(screen.queryByText(MSG_CONFERE)).not.toBeInTheDocument();
    expect(screen.queryByText(MSG_NAO_LIDO)).not.toBeInTheDocument();
    expect(screen.queryByText(MSG_DIFERENTE)).not.toBeInTheDocument();
  });

  it('com rascunho salvo, a mensagem do paciente não volta à tela', async () => {
    const api = mockApi();
    await api.anexarGuia(11, '202610701', pdf('Guia_202610701.pdf'),
      [{ codDgp: '41001109', descricao: 'TC - Abdome superior', quantidade: 1 }],
      { ug: 'Cmdo Bda Inf Amv', ugOrigem: 'Cmdo Bda Inf Amv', validadeAte: '2027-01-01' });
    await abrir(api);
    await screen.findByText('Guia_202610701.pdf');

    expect(screen.queryByText(MSG_CONFERE)).not.toBeInTheDocument();
    expect(screen.queryByText(MSG_NAO_LIDO)).not.toBeInTheDocument();
    expect(botaoConcluir()).toBeEnabled();
  });

  it('remover o anexo limpa a mensagem do paciente', async () => {
    const usuario = userEvent.setup();
    await abrir();
    await anexarPdf(usuario, 'guia-ok.pdf');
    expect(screen.getByText(MSG_CONFERE)).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Remover anexo' }));
    expect(screen.queryByText(MSG_CONFERE)).not.toBeInTheDocument();
    expect(botaoConcluir()).toBeDisabled();
  });

  it('envia o preGuiaId na leitura para o servidor comparar o Prec CP', async () => {
    const usuario = userEvent.setup();
    const api = mockApi();
    const extrair = vi.spyOn(api, 'extrairNumeroGuia');
    await abrir(api);
    await anexarPdf(usuario, 'guia-ok.pdf');

    expect(extrair).toHaveBeenCalledWith(expect.any(File), 11);
  });
});
