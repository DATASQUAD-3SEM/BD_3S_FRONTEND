import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import PreGuiaSetorPage from './PreGuiaSetorPage';
import { criarMockPreGuiaSetor } from './api.mock';
import { ApiError } from '../../shared/api/http';

/**
 * Testes do detalhe da pre-guia do Setor de Guias (T4-FE): abertura, decisao, anexo e conclusao da Guia.
 */

beforeAll(() => {
  // O jsdom não implementa URLs de objeto (blob)
  URL.createObjectURL = vi.fn(() => 'blob:teste');
  URL.revokeObjectURL = vi.fn();
});

const mockApi = () => criarMockPreGuiaSetor({ atrasoMs: 0 });

const renderizar = (id: number, api = mockApi()) => render(<PreGuiaSetorPage id={id} api={api} />);

const pdf = (nome: string) => new File(['%PDF-1.4'], nome, { type: 'application/pdf' });

describe('T4-FE · Tela Pré-guia {número}', () => {
  it('mostra o título, o badge e os dados do beneficiário', async () => {
    renderizar(11);
    expect(await screen.findByRole('heading', { name: 'Pré-guia 0411' })).toBeInTheDocument();
    expect(screen.getByText('Em análise')).toBeInTheDocument();
    expect(screen.getByText('Marta Souza Lima')).toBeInTheDocument();
    expect(screen.getByText('458100200-01')).toBeInTheDocument();
    expect(screen.getByText('41 a 50')).toBeInTheDocument();
    expect(screen.getByText('Laboratório Exemplo')).toBeInTheDocument();
  });

  it('origem médico mostra exames, quem criou e a mensagem de sem anexo', async () => {
    renderizar(11);
    expect(await screen.findByText('40304361 · Hemograma completo')).toBeInTheDocument();
    expect(screen.getByText('40301630 · Glicose')).toBeInTheDocument();
    expect(screen.getByText('Criada pelo Cap Méd Ribeiro (CRM 000.000-SP)')).toBeInTheDocument();
    expect(screen.getByText('Não há anexo: pré-guia criada pelo médico')).toBeInTheDocument();
  });

  it('origem beneficiário esconde os exames e mostra o encaminhamento', async () => {
    renderizar(12);
    expect(await screen.findByTitle('Encaminhamento: encaminhamento-0412.pdf')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Exames solicitados' })).not.toBeInTheDocument();
  });

  it('pré-guia pendente chama a abertura e o badge vira Em análise', async () => {
    const api = mockApi();
    const abrir = vi.spyOn(api, 'abrir');
    renderizar(12, api);
    expect(await screen.findByText('Em análise')).toBeInTheDocument();
    expect(abrir).toHaveBeenCalledWith(12);
  });

  it('Requerer correção fica desabilitado sem observação e abre a confirmação', async () => {
    const usuario = userEvent.setup();
    renderizar(11);
    const botao = await screen.findByRole('button', { name: 'Requerer correção' });
    expect(botao).toBeDisabled();

    await usuario.type(screen.getByLabelText('Observação (obrigatória)'), 'Falta o documento');
    expect(botao).toBeEnabled();

    await usuario.click(botao);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('confirmar a correção muda a tela para aguardando correção do beneficiário', async () => {
    const usuario = userEvent.setup();
    renderizar(11);
    await usuario.type(await screen.findByLabelText('Observação (obrigatória)'), 'Falta o documento');
    await usuario.click(screen.getByRole('button', { name: 'Requerer correção' }));
    await usuario.click(screen.getByRole('button', { name: 'Confirmar correção' }));
    expect(await screen.findByText('Aguardando correção.')).toBeInTheDocument();
  });

  it('Concluir inicia desabilitado e "Anexar Guia" fica disponível', async () => {
    renderizar(11);
    expect(await screen.findByRole('button', { name: 'Concluir' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Anexar Guia' })).toBeEnabled();
    expect(screen.getByText('Disponível depois de anexar a Guia.')).toBeInTheDocument();
  });

  it('anexar PDF com número legível preenche o campo e habilita Concluir', async () => {
    const usuario = userEvent.setup();
    renderizar(11);
    await screen.findByRole('button', { name: 'Concluir' });

    await usuario.upload(screen.getByLabelText('Escolher PDF da Guia'), pdf('Guia_12.pdf'));
    expect(await screen.findByText('Número extraído automaticamente. Você pode editar se necessário.')).toBeInTheDocument();
    expect(screen.getByLabelText('Número da Guia')).toHaveValue('202610678');
    expect(screen.getByText('PDF anexado')).toBeInTheDocument();
    expect(screen.getByText('Guia_12.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeEnabled();
    expect(
      screen.getByText('Ao concluir, a Guia segue para a assinatura do médico e do chefe.'),
    ).toBeInTheDocument();
  });

  it('a leitura não grava nada: só o PUT do Concluir envia o PDF', async () => {
    const usuario = userEvent.setup();
    const api = mockApi();
    const anexar = vi.spyOn(api, 'anexarGuia');
    renderizar(11, api);
    await screen.findByRole('button', { name: 'Concluir' });

    await usuario.upload(screen.getByLabelText('Escolher PDF da Guia'), pdf('Guia_12.pdf'));
    await screen.findByText('Número extraído automaticamente. Você pode editar se necessário.');
    expect(anexar).not.toHaveBeenCalled();

    await usuario.click(screen.getByRole('button', { name: 'Concluir' }));
    expect(anexar).toHaveBeenCalledWith(11, '202610678', expect.any(File));
    expect(await screen.findByText('Guia já enviada para assinatura')).toBeInTheDocument();
  });

  it('durante a leitura, o botão mostra "Lendo arquivo..." e Concluir fica desabilitado', async () => {
    const usuario = userEvent.setup();
    const api = mockApi();
    let liberar: () => void = () => {};
    vi.spyOn(api, 'extrairNumeroGuia').mockImplementationOnce(
      () => new Promise((resolve) => (liberar = () => resolve({ numeroGuia: '202610678' }))),
    );
    renderizar(11, api);
    await screen.findByRole('button', { name: 'Concluir' });

    await usuario.upload(screen.getByLabelText('Escolher PDF da Guia'), pdf('Guia_12.pdf'));
    expect(await screen.findByRole('button', { name: 'Lendo arquivo...' })).toBeDisabled();
    expect(screen.getByLabelText('Número da Guia')).toBeDisabled();
    expect(screen.getByText('Lendo o número da Guia...')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeDisabled();

    liberar();
    expect(await screen.findByRole('button', { name: 'Trocar arquivo' })).toBeEnabled();
  });

  it('PDF sem número legível (422) libera o campo e mantém Concluir desabilitado até digitar', async () => {
    const usuario = userEvent.setup();
    renderizar(11);
    await screen.findByRole('button', { name: 'Concluir' });

    await usuario.upload(screen.getByLabelText('Escolher PDF da Guia'), pdf('Guia_sem-numero.pdf'));
    expect(
      await screen.findByText('Não foi possível ler o número automaticamente. Digite o número da Guia.'),
    ).toBeInTheDocument();
    const campo = screen.getByLabelText('Número da Guia');
    expect(campo).toBeEnabled();
    expect(campo).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeDisabled();

    await usuario.type(campo, '987');
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeEnabled();
  });

  it('arquivo que não é PDF mostra erro, não chama a leitura e mantém o anexo anterior', async () => {
    const usuario = userEvent.setup();
    const api = mockApi();
    const extrair = vi.spyOn(api, 'extrairNumeroGuia');
    renderizar(11, api);
    await screen.findByRole('button', { name: 'Concluir' });

    await usuario.upload(screen.getByLabelText('Escolher PDF da Guia'), pdf('Guia_12.pdf'));
    await screen.findByText('Guia_12.pdf');
    extrair.mockClear();

    // applyAccept: false envia o arquivo mesmo fora do accept, como um usuario que escolhe "Todos os arquivos"
    const jpeg = new File(['\xff\xd8\xff'], 'foto.jpg', { type: 'image/jpeg' });
    await userEvent.setup({ applyAccept: false }).upload(screen.getByLabelText('Escolher PDF da Guia'), jpeg);
    expect(await screen.findByRole('alert')).toHaveTextContent('Arquivo inválido. Envie um PDF.');
    expect(extrair).not.toHaveBeenCalled();
    expect(screen.getByText('Guia_12.pdf')).toBeInTheDocument();
    expect(screen.getByLabelText('Número da Guia')).toHaveValue('202610678');
  });

  it('arquivo acima de 10 MB é recusado no navegador', async () => {
    const usuario = userEvent.setup();
    renderizar(11);
    await screen.findByRole('button', { name: 'Concluir' });

    const grande = pdf('grande.pdf');
    Object.defineProperty(grande, 'size', { value: 10 * 1024 * 1024 + 1 });
    await usuario.upload(screen.getByLabelText('Escolher PDF da Guia'), grande);
    expect(await screen.findByRole('alert')).toHaveTextContent('O PDF passa de 10 MB. Envie um arquivo menor.');
    expect(screen.getByRole('button', { name: 'Anexar Guia' })).toBeEnabled();
  });

  it('trocar o arquivo limpa o número e refaz a leitura', async () => {
    const usuario = userEvent.setup();
    renderizar(11);
    await screen.findByRole('button', { name: 'Concluir' });

    await usuario.upload(screen.getByLabelText('Escolher PDF da Guia'), pdf('Guia_12.pdf'));
    await screen.findByText('Guia_12.pdf');

    await usuario.click(screen.getByRole('button', { name: 'Trocar arquivo' }));
    await usuario.upload(screen.getByLabelText('Escolher PDF da Guia'), pdf('Guia_sem-numero.pdf'));
    expect(await screen.findByText('Guia_sem-numero.pdf')).toBeInTheDocument();
    expect(screen.getByLabelText('Número da Guia')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeDisabled();
  });

  it('remover o anexo limpa o campo e desabilita Concluir', async () => {
    const usuario = userEvent.setup();
    renderizar(11);
    await screen.findByRole('button', { name: 'Concluir' });

    await usuario.upload(screen.getByLabelText('Escolher PDF da Guia'), pdf('Guia_12.pdf'));
    await screen.findByText('Guia_12.pdf');

    await usuario.click(screen.getByRole('button', { name: 'Remover anexo' }));
    expect(screen.queryByText('PDF anexado')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Número da Guia')).toHaveValue('');
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeDisabled();
  });

  it('o número pode ser editado depois da leitura e a conclusão usa o valor do campo', async () => {
    const usuario = userEvent.setup();
    const api = mockApi();
    const anexar = vi.spyOn(api, 'anexarGuia');
    renderizar(11, api);
    await screen.findByRole('button', { name: 'Concluir' });

    await usuario.upload(screen.getByLabelText('Escolher PDF da Guia'), pdf('Guia_12.pdf'));
    const campo = await screen.findByLabelText('Número da Guia');
    await screen.findByDisplayValue('202610678');
    await usuario.clear(campo);
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeDisabled();

    await usuario.type(campo, '202699999');
    await usuario.click(screen.getByRole('button', { name: 'Concluir' }));
    expect(anexar).toHaveBeenCalledWith(11, '202699999', expect.any(File));
  });

  it('429 mostra "Tentar novamente" e mantém o arquivo anexado', async () => {
    const usuario = userEvent.setup();
    const api = mockApi();
    vi.spyOn(api, 'extrairNumeroGuia').mockRejectedValueOnce(new ApiError(429, 'limite'));
    renderizar(11, api);
    await screen.findByRole('button', { name: 'Concluir' });

    await usuario.upload(screen.getByLabelText('Escolher PDF da Guia'), pdf('Guia_12.pdf'));
    expect(
      await screen.findByText('Muitas tentativas de leitura. Aguarde um instante e tente novamente.'),
    ).toBeInTheDocument();
    expect(screen.getByText('Guia_12.pdf')).toBeInTheDocument();

    await usuario.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByLabelText('Número da Guia')).toHaveValue('202610678');
  });

  it('500 mostra "Tentar novamente" e mantém o arquivo anexado', async () => {
    const usuario = userEvent.setup();
    renderizar(11);
    await screen.findByRole('button', { name: 'Concluir' });

    await usuario.upload(screen.getByLabelText('Escolher PDF da Guia'), pdf('Guia_falha.pdf'));
    expect(await screen.findByText('Não foi possível ler o PDF agora. Tente novamente.')).toBeInTheDocument();
    expect(screen.getByText('Guia_falha.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Tentar novamente' })).toBeEnabled();
  });

  it('com rascunho salvo, mostra o anexo e o número salvos com Concluir habilitado', async () => {
    const api = mockApi();
    await api.anexarGuia(11, '202610701', pdf('Guia_202610701.pdf'));
    renderizar(11, api);

    expect(await screen.findByText('PDF anexado')).toBeInTheDocument();
    expect(screen.getByText('Guia_202610701.pdf')).toBeInTheDocument();
    expect(screen.getByLabelText('Número da Guia')).toHaveValue('202610701');
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeEnabled();
    expect(screen.queryByText('Informe o número da Guia antes de anexar o PDF')).not.toBeInTheDocument();
  });

  it('com rascunho salvo, editar o número mantém o anexo salvo visível', async () => {
    const usuario = userEvent.setup();
    const api = mockApi();
    await api.anexarGuia(11, '202610701', pdf('Guia_202610701.pdf'));
    renderizar(11, api);
    await screen.findByText('Guia_202610701.pdf');

    const campo = screen.getByLabelText('Número da Guia');
    await usuario.clear(campo);
    await usuario.type(campo, '202610702');

    expect(screen.getByText('PDF anexado')).toBeInTheDocument();
    expect(screen.getByText('Guia_202610701.pdf')).toBeInTheDocument();
    // o rascunho guarda outro número: sem novo PDF não há como salvar a edição
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeDisabled();
  });

  it('com rascunho salvo, remover o anexo esconde o rascunho e desabilita Concluir mesmo com o número salvo', async () => {
    const usuario = userEvent.setup();
    const api = mockApi();
    await api.anexarGuia(11, '202610701', pdf('Guia_202610701.pdf'));
    renderizar(11, api);
    await screen.findByText('Guia_202610701.pdf');

    await usuario.click(screen.getByRole('button', { name: 'Remover anexo' }));
    expect(screen.queryByText('PDF anexado')).not.toBeInTheDocument();
    expect(screen.getByLabelText('Número da Guia')).toHaveValue('');

    await usuario.type(screen.getByLabelText('Número da Guia'), '202610701');
    expect(screen.queryByText('PDF anexado')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeDisabled();
  });

  it('concluir a Guia mostra que ela foi enviada para assinatura', async () => {
    const usuario = userEvent.setup();
    const api = mockApi();
    await api.anexarGuia(11, '202610701', pdf('Guia_202610701.pdf'));
    renderizar(11, api);

    await usuario.click(await screen.findByRole('button', { name: 'Concluir' }));
    expect(await screen.findByText('Guia já enviada para assinatura')).toBeInTheDocument();
  });

  it('mostra o aviso de pré-guia já alterada quando a API responde 409', async () => {
    const usuario = userEvent.setup();
    const api = mockApi();
    vi.spyOn(api, 'requererCorrecao').mockRejectedValueOnce(new ApiError(409, 'conflito'));
    renderizar(11, api);

    await usuario.type(await screen.findByLabelText('Observação (obrigatória)'), 'Falta documento');
    await usuario.click(screen.getByRole('button', { name: 'Requerer correção' }));
    await usuario.click(screen.getByRole('button', { name: 'Confirmar correção' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('Esta pré-guia já foi alterada');
  });

  it('mostra a tela de não encontrada quando a pré-guia não existe', async () => {
    renderizar(999);
    expect(await screen.findByRole('heading', { name: 'Pré-guia não encontrada' })).toBeInTheDocument();
  });

  it('pré-guia com Guia concluída mostra que ela já foi enviada para assinatura', async () => {
    renderizar(1);
    expect(await screen.findByText('Guia já enviada para assinatura')).toBeInTheDocument();
  });
});
