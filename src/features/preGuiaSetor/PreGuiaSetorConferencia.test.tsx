import { describe, it, expect, vi, beforeAll, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import PreGuiaSetorPage from './PreGuiaSetorPage';
import { criarMockPreGuiaSetor } from './api.mock';
import { ApiError } from '../../shared/api/http';

/**
 * T16-FE: conferencia de UG, UG Origem e validade no bloco "Gerar a Guia". Os PDFs de cenario do prototipo
 * ("guia-ok", "guia-outra-ug", ...) escolhem o que a leitura devolve.
 */

beforeAll(() => {
  URL.createObjectURL = vi.fn(() => 'blob:teste');
  URL.revokeObjectURL = vi.fn();
});

// "guia-ok" e "guia-sem-validade" usam datas fixas do protótipo: congela só a data de hoje (18/11/2026)
// para o resultado não depender do dia em que o teste roda.
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 10, 18, 12));
});
afterEach(() => {
  vi.useRealTimers();
});

const mockApi = () => criarMockPreGuiaSetor({ atrasoMs: 0 });
const pdf = (nome: string) => new File(['%PDF-1.4'], nome, { type: 'application/pdf' });

const UG_FUSEX = 'Cmdo Bda Inf Amv';
const EXAMES_EXEMPLO = [
  { codDgp: '41001109', descricao: 'TC - Abdome superior', quantidade: 1 },
  { codDgp: '41001110', descricao: 'Ultrassonografia de abdome total', quantidade: 2 },
];

const MSG_PENDENTE = 'Não é possível concluir com a conferência pendente. Troque o arquivo ou corrija os campos.';
const MSG_UG_OUTRA = 'Esta Guia não é do FUSEX. A UG deve ser Cmdo Bda Inf Amv.';
const MSG_UG_ORIGEM_OUTRA = 'A UG Origem impressa na Guia é diferente de Cmdo Bda Inf Amv. Esta Guia não é do FUSEX.';
const MSG_VALIDADE_VAZIA = 'Não foi possível ler a validade. Digite a data impressa em NÃO RECEBER APÓS.';
const MSG_UG_VAZIA = 'Não foi possível ler a UG. Digite a UG impressa na Guia.';

const campoUg = () => screen.getByLabelText('UG da Guia');
const campoValidade = () => screen.getByLabelText('Validade (NÃO RECEBER APÓS)');
const botaoConcluir = () => screen.getByRole('button', { name: 'Concluir' });

const anexarPdf = async (usuario: ReturnType<typeof userEvent.setup>, nome: string) => {
  await usuario.upload(screen.getByLabelText('Escolher PDF da Guia'), pdf(nome));
  await screen.findByText('PDF anexado');
};

const abrir = async (api = mockApi()) => {
  render(<PreGuiaSetorPage id={11} api={api} />);
  await screen.findByRole('button', { name: 'Concluir' });
  return api;
};

describe('T16-FE · Conferência de UG, UG Origem e validade', () => {
  it('sem PDF, os campos estão vazios, sem erro, e Concluir fica desabilitado', async () => {
    await abrir();
    expect(campoUg()).toHaveValue('');
    expect(campoValidade()).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(botaoConcluir()).toBeDisabled();
    expect(screen.getByText('Disponível depois de anexar a Guia.')).toBeInTheDocument();
  });

  it('depois da leitura, UG e validade aparecem preenchidas e não há campo de UG Origem', async () => {
    const usuario = userEvent.setup();
    await abrir();
    await anexarPdf(usuario, 'guia-ok.pdf');

    expect(campoUg()).toHaveValue('Cmdo Bda Inf Amv');
    expect(campoValidade()).toHaveValue('01/01/2027');
    expect(screen.queryByLabelText(/UG Origem/)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(botaoConcluir()).toBeEnabled();
    expect(screen.getByText('Ao concluir, a Guia segue para a assinatura do médico e do chefe.')).toBeInTheDocument();
  });

  it('UG com espaços extras e maiúsculas trocadas é aceita, e editar não grava nada', async () => {
    const usuario = userEvent.setup();
    const api = mockApi();
    const anexar = vi.spyOn(api, 'anexarGuia');
    await abrir(api);
    await anexarPdf(usuario, 'guia-ok.pdf');

    await usuario.clear(campoUg());
    await usuario.type(campoUg(), '  CMDO   bda inf AMV ');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(botaoConcluir()).toBeEnabled();
    expect(anexar).not.toHaveBeenCalled();
  });

  it('UG diferente bloqueia o Concluir, explica o motivo e some quando corrigida', async () => {
    const usuario = userEvent.setup();
    await abrir();
    await anexarPdf(usuario, 'guia-outra-ug.pdf');

    expect(campoUg()).toHaveValue('Cmdo Bda Inf Sul');
    expect(screen.getByRole('alert')).toHaveTextContent(MSG_UG_OUTRA);
    expect(botaoConcluir()).toBeDisabled();
    expect(screen.getByText(MSG_PENDENTE)).toBeInTheDocument();

    await usuario.clear(campoUg());
    await usuario.type(campoUg(), 'Cmdo Bda Inf Amv');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(botaoConcluir()).toBeEnabled();
    expect(screen.queryByText(MSG_PENDENTE)).not.toBeInTheDocument();
  });

  it('UG vazia mostra o erro de leitura e Concluir só habilita depois de digitar a UG', async () => {
    const usuario = userEvent.setup();
    const api = mockApi();
    vi.spyOn(api, 'extrairNumeroGuia').mockResolvedValueOnce({
      numeroGuia: '202610678',
      exames: EXAMES_EXEMPLO,
      ug: null,
      ugOrigem: null,
      validadeAte: '2027-01-01',
    });
    await abrir(api);
    await anexarPdf(usuario, 'guia-12.pdf');

    expect(campoUg()).toHaveValue('');
    expect(screen.getByRole('alert')).toHaveTextContent(MSG_UG_VAZIA);
    expect(botaoConcluir()).toBeDisabled();

    // a UG Origem não foi lida: ela não bloqueia, só a UG do campo conta
    await usuario.type(campoUg(), 'Cmdo Bda Inf Amv');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(botaoConcluir()).toBeEnabled();
  });

  it('UG correta com UG Origem lida diferente bloqueia, e corrigir a UG do campo não altera a UG Origem lida', async () => {
    const usuario = userEvent.setup();
    await abrir();
    await anexarPdf(usuario, 'guia-ug-origem-outra.pdf');

    expect(campoUg()).toHaveValue('Cmdo Bda Inf Amv');
    expect(screen.getByRole('alert')).toHaveTextContent(MSG_UG_ORIGEM_OUTRA);
    expect(botaoConcluir()).toBeDisabled();
    expect(screen.getByText(MSG_PENDENTE)).toBeInTheDocument();

    await usuario.clear(campoUg());
    await usuario.type(campoUg(), 'Cmdo Bda Inf Amv');
    expect(screen.getByRole('alert')).toHaveTextContent(MSG_UG_ORIGEM_OUTRA);
    expect(botaoConcluir()).toBeDisabled();
  });

  it('validade vencida bloqueia o Concluir com a data da Guia', async () => {
    const usuario = userEvent.setup();
    await abrir();
    await anexarPdf(usuario, 'guia-202610678-exemplo.pdf');

    expect(campoValidade()).toHaveValue('20/10/2026');
    expect(screen.getByRole('alert')).toHaveTextContent('Esta Guia já venceu em 20/10/2026. Não é possível concluir.');
    expect(botaoConcluir()).toBeDisabled();
    expect(screen.getByText(MSG_PENDENTE)).toBeInTheDocument();
  });

  it('validade de hoje é aceita e a de ontem vence', async () => {
    const usuario = userEvent.setup();
    await abrir();
    await anexarPdf(usuario, 'guia-ok.pdf');

    await usuario.clear(campoValidade());
    await usuario.type(campoValidade(), '17112026');
    expect(screen.getByRole('alert')).toHaveTextContent('Esta Guia já venceu em 17/11/2026. Não é possível concluir.');
    expect(botaoConcluir()).toBeDisabled();

    await usuario.clear(campoValidade());
    await usuario.type(campoValidade(), '18112026');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(botaoConcluir()).toBeEnabled();
  });

  it('validade não lida deixa o campo vazio com erro e só habilita depois de digitar uma data válida', async () => {
    const usuario = userEvent.setup();
    await abrir();
    await anexarPdf(usuario, 'guia-sem-validade.pdf');

    expect(campoValidade()).toHaveValue('');
    expect(screen.getByRole('alert')).toHaveTextContent(MSG_VALIDADE_VAZIA);
    expect(botaoConcluir()).toBeDisabled();

    await usuario.type(campoValidade(), '31022027');
    expect(campoValidade()).toHaveValue('31/02/2027');
    expect(screen.getByRole('alert')).toHaveTextContent('Data inválida. Use o formato dd/mm/aaaa.');
    expect(botaoConcluir()).toBeDisabled();

    await usuario.clear(campoValidade());
    await usuario.type(campoValidade(), '01012027');
    expect(campoValidade()).toHaveValue('01/01/2027');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(botaoConcluir()).toBeEnabled();
  });

  it('Concluir envia ug do campo, ugOrigem lida e a validade em yyyy-mm-dd', async () => {
    const usuario = userEvent.setup();
    const api = mockApi();
    const anexar = vi.spyOn(api, 'anexarGuia');
    await abrir(api);
    await anexarPdf(usuario, 'guia-ok.pdf');

    await usuario.clear(campoUg());
    await usuario.type(campoUg(), '  cmdo bda inf amv ');
    await usuario.click(botaoConcluir());

    expect(anexar).toHaveBeenCalledWith(11, '202610678', expect.any(File), EXAMES_EXEMPLO, {
      ug: 'cmdo bda inf amv', // o campo, sem espaços nas pontas
      ugOrigem: 'Cmdo Bda Inf Amv', // a lida do PDF, que a correção do campo não altera
      validadeAte: '2027-01-01',
    });
    expect(await screen.findByText('Guia já enviada para assinatura')).toBeInTheDocument();
  });

  it('com a UG Origem não lida, ugOrigem leva o mesmo valor do campo UG', async () => {
    const usuario = userEvent.setup();
    const api = mockApi();
    vi.spyOn(api, 'extrairNumeroGuia').mockResolvedValueOnce({
      numeroGuia: '202610678',
      exames: EXAMES_EXEMPLO,
      ug: 'Cmdo Bda Inf Amv',
      ugOrigem: null,
      validadeAte: '2027-01-01',
    });
    const anexar = vi.spyOn(api, 'anexarGuia');
    await abrir(api);
    await anexarPdf(usuario, 'guia-12.pdf');

    await usuario.click(botaoConcluir());
    expect(anexar).toHaveBeenCalledWith(11, '202610678', expect.any(File), EXAMES_EXEMPLO, {
      ug: 'Cmdo Bda Inf Amv',
      ugOrigem: 'Cmdo Bda Inf Amv',
      validadeAte: '2027-01-01',
    });
  });

  it('422 do servidor sobre a UG aparece abaixo do campo e a Guia não é concluída', async () => {
    const usuario = userEvent.setup();
    const api = mockApi();
    vi.spyOn(api, 'anexarGuia').mockRejectedValueOnce(
      new ApiError(422, 'Dados invalidos', ['ug: A Guia não é do FUSEX. A UG deve ser Cmdo Bda Inf Amv.']),
    );
    const concluir = vi.spyOn(api, 'concluirGuia');
    await abrir(api);
    await anexarPdf(usuario, 'guia-ok.pdf');

    await usuario.click(botaoConcluir());
    expect(await screen.findByRole('alert')).toHaveTextContent(
      'A Guia não é do FUSEX. A UG deve ser Cmdo Bda Inf Amv.',
    );
    expect(concluir).not.toHaveBeenCalled();
    expect(screen.queryByText('Guia já enviada para assinatura')).not.toBeInTheDocument();

    // editar o campo tira a mensagem do servidor
    await usuario.type(campoUg(), ' ');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('422 do servidor sobre a validade e sobre a UG Origem aparecem abaixo dos campos', async () => {
    const usuario = userEvent.setup();
    const api = mockApi();
    vi.spyOn(api, 'anexarGuia')
      .mockRejectedValueOnce(
        new ApiError(422, 'Dados invalidos', ['validadeAte: Esta Guia já venceu em 17/11/2026. Não é possível concluir.']),
      )
      .mockRejectedValueOnce(new ApiError(422, 'Dados invalidos', [`ugOrigem: ${MSG_UG_ORIGEM_OUTRA}`]));
    await abrir(api);
    await anexarPdf(usuario, 'guia-ok.pdf');

    await usuario.click(botaoConcluir());
    expect(await screen.findByText('Esta Guia já venceu em 17/11/2026. Não é possível concluir.')).toBeInTheDocument();
    expect(screen.queryByText('Guia já enviada para assinatura')).not.toBeInTheDocument();

    await usuario.click(botaoConcluir());
    expect(await screen.findByText(MSG_UG_ORIGEM_OUTRA)).toBeInTheDocument();
    expect(screen.queryByText('Guia já enviada para assinatura')).not.toBeInTheDocument();
  });

  it('trocar o arquivo substitui UG, UG Origem e validade lidas', async () => {
    const usuario = userEvent.setup();
    await abrir();
    await anexarPdf(usuario, 'guia-ug-origem-outra.pdf');
    expect(screen.getByRole('alert')).toHaveTextContent(MSG_UG_ORIGEM_OUTRA);

    await usuario.click(screen.getByRole('button', { name: 'Trocar arquivo' }));
    await usuario.upload(screen.getByLabelText('Escolher PDF da Guia'), pdf('guia-sem-validade.pdf'));
    await screen.findByText('guia-sem-validade.pdf');

    expect(campoUg()).toHaveValue('Cmdo Bda Inf Amv');
    expect(campoValidade()).toHaveValue('');
    // a UG Origem lida do arquivo anterior não sobrou: só o erro de validade aparece
    expect(screen.queryByText(MSG_UG_ORIGEM_OUTRA)).not.toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent(MSG_VALIDADE_VAZIA);
  });

  it('remover o anexo limpa UG e validade, esconde os erros e desabilita Concluir', async () => {
    const usuario = userEvent.setup();
    await abrir();
    await anexarPdf(usuario, 'guia-outra-ug.pdf');
    expect(screen.getByRole('alert')).toHaveTextContent(MSG_UG_OUTRA);

    await usuario.click(screen.getByRole('button', { name: 'Remover anexo' }));
    expect(campoUg()).toHaveValue('');
    expect(campoValidade()).toHaveValue('');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(botaoConcluir()).toBeDisabled();
    expect(screen.getByText('Disponível depois de anexar a Guia.')).toBeInTheDocument();
  });
});

describe('T16-FE · Conferência com rascunho salvo', () => {
  // validadeAte undefined: o rascunho volta sem validade, como o de antes da T16-BE2
  const semearRascunho = async (validadeAte: string | undefined) => {
    const api = mockApi();
    await api.anexarGuia(11, '202610701', pdf('Guia_202610701.pdf'), EXAMES_EXEMPLO, {
      ug: UG_FUSEX,
      ugOrigem: UG_FUSEX,
      validadeAte: '2027-01-01',
    });
    if (validadeAte !== '2027-01-01') {
      const detalhar = api.detalhar.bind(api);
      vi.spyOn(api, 'detalhar').mockImplementation(async (id) => {
        const detalhe = await detalhar(id);
        return {
          ...detalhe,
          guiaRascunho: detalhe.guiaRascunho && { ...detalhe.guiaRascunho, validadeAte },
        };
      });
    }
    return api;
  };

  it('mostra a validade salva e a UG do FUSEX, sem UG Origem, com Concluir habilitado', async () => {
    await abrir(await semearRascunho('2027-01-01'));
    await screen.findByText('Guia_202610701.pdf');

    expect(campoUg()).toHaveValue('Cmdo Bda Inf Amv');
    expect(campoValidade()).toHaveValue('01/01/2027');
    expect(screen.queryByLabelText(/UG Origem/)).not.toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(botaoConcluir()).toBeEnabled();
  });

  it('validade salva já vencida recebe a mesma conferência do navegador', async () => {
    await abrir(await semearRascunho('2020-01-15'));
    await screen.findByText('Guia_202610701.pdf');

    expect(campoValidade()).toHaveValue('15/01/2020');
    expect(screen.getByRole('alert')).toHaveTextContent('Esta Guia já venceu em 15/01/2020. Não é possível concluir.');
    expect(botaoConcluir()).toBeDisabled();
  });

  it('rascunho sem validade gravada pede a data e mantém Concluir desabilitado', async () => {
    await abrir(await semearRascunho(undefined));
    await screen.findByText('Guia_202610701.pdf');

    expect(campoValidade()).toHaveValue('');
    expect(screen.getByRole('alert')).toHaveTextContent(MSG_VALIDADE_VAZIA);
    expect(botaoConcluir()).toBeDisabled();
  });

  it('alterar a validade sem anexar o PDF de novo desabilita Concluir e explica o motivo', async () => {
    const usuario = userEvent.setup();
    await abrir(await semearRascunho('2027-01-01'));
    await screen.findByText('Guia_202610701.pdf');

    await usuario.clear(campoValidade());
    await usuario.type(campoValidade(), '02022027');
    expect(screen.getByText('Para salvar a alteração da validade, anexe o PDF da Guia de novo.')).toBeInTheDocument();
    expect(botaoConcluir()).toBeDisabled();
  });

  it('corrigir só a UG não exige anexar o PDF de novo: ela não é gravada', async () => {
    const usuario = userEvent.setup();
    await abrir(await semearRascunho('2027-01-01'));
    await screen.findByText('Guia_202610701.pdf');

    await usuario.clear(campoUg());
    expect(screen.getByRole('alert')).toHaveTextContent(MSG_UG_VAZIA);
    expect(botaoConcluir()).toBeDisabled();

    await usuario.type(campoUg(), 'cmdo bda inf amv');
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(botaoConcluir()).toBeEnabled();
  });
});
