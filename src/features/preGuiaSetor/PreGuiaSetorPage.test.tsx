import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import PreGuiaSetorPage from './PreGuiaSetorPage';
import { criarMockPreGuiaSetor } from './api.mock';
import { ApiError } from '../../shared/api/http';

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

  it('Concluir fica desabilitado até anexar o PDF com o número', async () => {
    const usuario = userEvent.setup();
    renderizar(11);
    const concluir = await screen.findByRole('button', { name: 'Concluir' });
    expect(concluir).toBeDisabled();
    expect(screen.getByText('Disponível depois de anexar a Guia.')).toBeInTheDocument();

    await usuario.type(screen.getByLabelText('Número da Guia'), 'abc12');
    expect(screen.getByLabelText('Número da Guia')).toHaveValue('12');

    await usuario.upload(screen.getByLabelText('Escolher PDF da Guia'), pdf('Guia_12.pdf'));
    expect(await screen.findByText('Guia_12.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Concluir' })).toBeEnabled();
    expect(
      screen.getByText('Ao concluir, a Guia segue para a assinatura do médico e do chefe.'),
    ).toBeInTheDocument();
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
