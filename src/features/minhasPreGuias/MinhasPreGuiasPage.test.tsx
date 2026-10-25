import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import MinhasPreGuiasPage from './MinhasPreGuiasPage';
import { preGuiasMock } from './api.mock';
import type { PreGuiaDoBeneficiario } from './types';

function criarApi(lista: PreGuiaDoBeneficiario[] = preGuiasMock) {
  return {
    listar: vi.fn().mockResolvedValue(lista),
    obterPdf: vi.fn().mockResolvedValue(new Blob(['pdf'], { type: 'application/pdf' })),
  };
}

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:fake');
  URL.revokeObjectURL = vi.fn();
  vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
});

describe('T1-FE · Minhas pré-guias', () => {
  it('mostra o skeleton enquanto carrega e depois os cartões', async () => {
    render(<MinhasPreGuiasPage api={criarApi()} />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(await screen.findByText(/Pré-guia 0004/)).toBeInTheDocument();
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
  });

  it('ordena da mais recente para a mais antiga', async () => {
    const invertida = [...preGuiasMock].reverse();
    render(<MinhasPreGuiasPage api={criarApi(invertida)} />);
    const titulos = (await screen.findAllByRole('heading', { level: 2 })).map((h) => h.textContent);
    expect(titulos[0]).toMatch(/0004/);
    expect(titulos[titulos.length - 1]).toMatch(/0001/);
  });

  it('Pendente: texto e badge amarelo', async () => {
    render(<MinhasPreGuiasPage api={criarApi()} />);
    const cartao = await screen.findByLabelText('Pré-guia 0001');
    expect(within(cartao).getByText('Pendente')).toHaveClass('badge-pendente');
    expect(within(cartao).getByText('Enviada ao setor de Guias. Ainda não foi aberta.')).toBeInTheDocument();
    expect(within(cartao).getByText(/Criada por você em 03\/10\/2026/)).toBeInTheDocument();
  });

  it('Em análise: texto e badge azul', async () => {
    render(<MinhasPreGuiasPage api={criarApi()} />);
    const cartao = await screen.findByLabelText('Pré-guia 0002');
    expect(within(cartao).getByText('Em análise')).toHaveClass('badge-em-analise');
    expect(within(cartao).getByText('O setor de Guias está analisando.')).toBeInTheDocument();
  });

  it('Atenção: mostra a observação e o botão leva à Tela 9', async () => {
    const onCorrigir = vi.fn();
    render(<MinhasPreGuiasPage api={criarApi()} onVisualizarECorrigir={onCorrigir} />);
    const cartao = await screen.findByLabelText('Pré-guia 0003');
    expect(within(cartao).getByText('Atenção')).toHaveClass('badge-atencao');
    expect(within(cartao).getByText('Observação do setor de Guias')).toBeInTheDocument();
    expect(within(cartao).getByText(/foto do encaminhamento está desfocada/)).toBeInTheDocument();
    await userEvent.click(within(cartao).getByRole('button', { name: 'Visualizar e corrigir' }));
    expect(onCorrigir).toHaveBeenCalledWith(3);
  });

  it('Atenção em pré-guia criada por médico: informa, sem botão de corrigir', async () => {
    const onCorrigir = vi.fn();
    render(<MinhasPreGuiasPage api={criarApi()} onVisualizarECorrigir={onCorrigir} />);
    const cartao = await screen.findByLabelText('Pré-guia 0005');
    expect(within(cartao).getByText('Atenção')).toHaveClass('badge-atencao');
    expect(within(cartao).getByText('Observação do setor de Guias')).toBeInTheDocument();
    expect(within(cartao).getByText(/Hemograma completo informado em duplicidade/)).toBeInTheDocument();
    expect(within(cartao).getByText('O que aconteceu?')).toBeInTheDocument();
    expect(within(cartao).getByText(/devolvida ao médico, que fará o ajuste/)).toBeInTheDocument();
    expect(within(cartao).queryByRole('button', { name: 'Visualizar e corrigir' })).not.toBeInTheDocument();
    const aguardando = within(cartao).getByRole('button', { name: 'Aguardando correção do médico' });
    expect(aguardando).toBeDisabled();
    await userEvent.click(aguardando);
    expect(onCorrigir).not.toHaveBeenCalled();
  });

  it('Atenção em pré-guia criada pelo beneficiário não mostra "O que aconteceu?"', async () => {
    render(<MinhasPreGuiasPage api={criarApi()} />);
    const cartao = await screen.findByLabelText('Pré-guia 0003');
    expect(within(cartao).queryByText('O que aconteceu?')).not.toBeInTheDocument();
  });

  it('Concluída: criada pelo médico, Guia, validade e botões', async () => {
    render(<MinhasPreGuiasPage api={criarApi()} />);
    const cartao = await screen.findByLabelText('Pré-guia 0004');
    expect(within(cartao).getByText('Concluída')).toHaveClass('badge-concluida');
    expect(within(cartao).getByText(/Criada pelo Cap Méd Ribeiro \(médico FUSEX\) em 09\/10\/2026/)).toBeInTheDocument();
    expect(within(cartao).getByText(/Guia nº 123456 · válida até 08\/12\/2026/)).toBeInTheDocument();
    expect(within(cartao).getByText('Assinada pelo médico e pelo chefe do FUSEX.')).toBeInTheDocument();
    expect(within(cartao).getByRole('button', { name: 'Baixar Guia (PDF)' })).toBeInTheDocument();
    expect(within(cartao).getByRole('button', { name: 'Visualizar' })).toBeInTheDocument();
    expect(within(cartao).getByRole('button', { name: 'Imprimir' })).toBeInTheDocument();
  });

  it('só Atenção tem o botão de corrigir e só Concluída tem os botões da Guia', async () => {
    render(<MinhasPreGuiasPage api={criarApi()} />);
    await screen.findByLabelText('Pré-guia 0001');
    expect(screen.getAllByRole('button', { name: 'Visualizar e corrigir' })).toHaveLength(1);
    expect(screen.getAllByRole('button', { name: 'Baixar Guia (PDF)' })).toHaveLength(1);
  });

  it('Baixar pede o PDF no modo baixar e dispara o download', async () => {
    const api = criarApi();
    render(<MinhasPreGuiasPage api={api} />);
    const cartao = await screen.findByLabelText('Pré-guia 0004');
    await userEvent.click(within(cartao).getByRole('button', { name: 'Baixar Guia (PDF)' }));
    await waitFor(() => expect(api.obterPdf).toHaveBeenCalledWith(4, 'baixar'));
    await waitFor(() => expect(HTMLAnchorElement.prototype.click).toHaveBeenCalled());
  });

  it('Visualizar abre o PDF em nova aba', async () => {
    const janela = { location: { href: '' }, close: vi.fn() };
    vi.spyOn(window, 'open').mockReturnValue(janela as unknown as Window);
    const api = criarApi();
    render(<MinhasPreGuiasPage api={api} />);
    const cartao = await screen.findByLabelText('Pré-guia 0004');
    await userEvent.click(within(cartao).getByRole('button', { name: 'Visualizar' }));
    await waitFor(() => expect(api.obterPdf).toHaveBeenCalledWith(4, 'visualizar'));
    await waitFor(() => expect(janela.location.href).toBe('blob:fake'));
    expect(window.open).toHaveBeenCalledWith('', '_blank');
  });

  it('erro ao obter o PDF aparece no próprio cartão', async () => {
    const api = criarApi();
    api.obterPdf.mockRejectedValue(new Error('Não foi possível obter o PDF da Guia.'));
    render(<MinhasPreGuiasPage api={api} />);
    const cartao = await screen.findByLabelText('Pré-guia 0004');
    await userEvent.click(within(cartao).getByRole('button', { name: 'Baixar Guia (PDF)' }));
    expect(await within(cartao).findByRole('alert')).toHaveTextContent('Não foi possível obter o PDF da Guia.');
    // os outros cartões não mostram o erro
    expect(within(screen.getByLabelText('Pré-guia 0001')).queryByRole('alert')).not.toBeInTheDocument();
  });

  it('lista vazia mostra o atalho para Nova pré-guia', async () => {
    const onNova = vi.fn();
    render(<MinhasPreGuiasPage api={criarApi([])} onNovaPreGuia={onNova} />);
    expect(await screen.findByText('Você ainda não tem pré-guias.')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Nova pré-guia' }));
    expect(onNova).toHaveBeenCalled();
  });

  it('erro na listagem mostra "Tentar novamente" e recarrega', async () => {
    const api = criarApi();
    api.listar.mockRejectedValueOnce(new Error('falhou'));
    render(<MinhasPreGuiasPage api={api} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar suas pré-guias.');
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText(/Pré-guia 0004/)).toBeInTheDocument();
    expect(api.listar).toHaveBeenCalledTimes(2);
  });
});
