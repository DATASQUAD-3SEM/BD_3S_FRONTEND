import { describe, it, expect, vi } from 'vitest';
import { render, screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import FilaPreGuiasPage from './FilaPreGuiasPage';
import type { PaginaFila } from './types';
import { filaMock } from './api.mock';

const linhaDe = (texto: string): HTMLTableRowElement => {
  const el = screen.getByText(texto).closest('tr');
  if (!el) throw new Error(`Linha não encontrada para "${texto}"`);
  return el;
};

const semPrecCp = (item: (typeof filaMock)[number]) => {
  const { precCp, ...resto } = item;
  void precCp;
  return resto;
};
const itensMock = filaMock.map(semPrecCp);

function criarApi(resposta: PaginaFila = { total: itensMock.length, pagina: 0, tamanho: 10, itens: itensMock }) {
  return { listar: vi.fn().mockResolvedValue(resposta) };
}

describe('T3-FE · Fila de pré-guias', () => {
  it('mostra o skeleton enquanto carrega e depois a tabela', async () => {
    render(<FilaPreGuiasPage api={criarApi()} />);
    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
    expect(await screen.findByText('0412')).toBeInTheDocument();
    expect(screen.queryByTestId('skeleton')).not.toBeInTheDocument();
  });

  it('mostra as colunas e os dados de cada pré-guia', async () => {
    render(<FilaPreGuiasPage api={criarApi()} />);
    await screen.findByText('0412');
    ['Nº', 'Beneficiário', 'OCS', 'Origem', 'Criada em', 'Status'].forEach((coluna) =>
      expect(screen.getByRole('columnheader', { name: coluna })).toBeInTheDocument(),
    );
    const linha = linhaDe('0411');
    expect(within(linha).getByText('Marta Souza Lima')).toBeInTheDocument();
    expect(within(linha).getByText('Laboratório Exemplo')).toBeInTheDocument();
    expect(within(linha).getByText('Médico')).toBeInTheDocument();
    expect(within(linha).getByText('11/10')).toBeInTheDocument();
    expect(within(linha).getByText('Em análise')).toHaveClass('badge-em-analise');
  });

  it('mostra a origem Beneficiário e o badge de cada status', async () => {
    render(<FilaPreGuiasPage api={criarApi()} />);
    await screen.findByText('0412');
    const linha412 = linhaDe('0412');
    expect(within(linha412).getByText('Beneficiário')).toBeInTheDocument();
    expect(within(linha412).getByText('Pendente')).toHaveClass('badge-pendente');
    expect(within(linhaDe('0409')).getByText('Atenção')).toHaveClass('badge-atencao');
    expect(within(linhaDe('0401')).getByText('Concluída')).toHaveClass('badge-concluida');
  });

  it('Abrir fica em destaque para Pendente e Em análise e secundário para Atenção e Concluída', async () => {
    render(<FilaPreGuiasPage api={criarApi()} />);
    await screen.findByText('0412');
    expect(screen.getByRole('button', { name: 'Abrir pré-guia 0412' })).toHaveClass('botao-primario');
    expect(screen.getByRole('button', { name: 'Abrir pré-guia 0411' })).toHaveClass('botao-primario');
    expect(screen.getByRole('button', { name: 'Abrir pré-guia 0409' })).not.toHaveClass('botao-primario');
    expect(screen.getByRole('button', { name: 'Abrir pré-guia 0401' })).not.toHaveClass('botao-primario');
  });

  it('Abrir navega com o id da pré-guia e não chama a API de novo', async () => {
    const api = criarApi();
    const onAbrir = vi.fn();
    render(<FilaPreGuiasPage api={api} onAbrir={onAbrir} />);
    await screen.findByText('0412');
    await userEvent.click(screen.getByRole('button', { name: 'Abrir pré-guia 0409' }));
    expect(onAbrir).toHaveBeenCalledWith(9);
    expect(api.listar).toHaveBeenCalledTimes(1);
  });

  it('busca com 300 ms de espera e envia o termo à API', async () => {
    const api = criarApi();
    render(<FilaPreGuiasPage api={api} />);
    await screen.findByText('0412');
    await userEvent.type(screen.getByLabelText('Buscar por beneficiário ou Prec CP'), 'marta');
    await waitFor(() => expect(api.listar).toHaveBeenLastCalledWith(expect.objectContaining({ busca: 'marta', page: 0 })));
    // digitar 5 letras seguidas não dispara 5 consultas
    expect(api.listar.mock.calls.length).toBeLessThanOrEqual(3);
  });

  it('filtro de status envia o status à API e volta para a primeira página', async () => {
    const api = criarApi();
    render(<FilaPreGuiasPage api={api} />);
    await screen.findByText('0412');
    const select = screen.getByLabelText('Filtrar por status');
    expect(within(select).getAllByRole('option').map((o) => o.textContent)).toEqual([
      'Todos os status', 'Pendente', 'Em análise', 'Atenção', 'Concluída',
    ]);
    await userEvent.selectOptions(select, 'ATENCAO');
    await waitFor(() =>
      expect(api.listar).toHaveBeenLastCalledWith(expect.objectContaining({ status: 'ATENCAO', page: 0 })),
    );
  });

  it('paginação: Próxima e Anterior pedem a página certa', async () => {
    const api = criarApi({ total: 25, pagina: 0, tamanho: 10, itens: itensMock });
    render(<FilaPreGuiasPage api={api} />);
    await screen.findByText('0412');
    expect(screen.getByText(/Página 1 de 3 · 25 pré-guias/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Anterior' })).toBeDisabled();

    await userEvent.click(screen.getByRole('button', { name: 'Próxima' }));
    await waitFor(() => expect(api.listar).toHaveBeenLastCalledWith(expect.objectContaining({ page: 1 })));
    await screen.findByText(/Página 2 de 3/);

    await userEvent.click(screen.getByRole('button', { name: 'Anterior' }));
    await waitFor(() => expect(api.listar).toHaveBeenLastCalledWith(expect.objectContaining({ page: 0 })));
  });

  it('sem mais de uma página, não mostra a paginação', async () => {
    render(<FilaPreGuiasPage api={criarApi()} />);
    await screen.findByText('0412');
    expect(screen.queryByRole('navigation', { name: 'Paginação' })).not.toBeInTheDocument();
  });

  it('lista vazia mostra "Nenhuma pré-guia encontrada"', async () => {
    render(<FilaPreGuiasPage api={criarApi({ total: 0, pagina: 0, tamanho: 10, itens: [] })} />);
    expect(await screen.findByText('Nenhuma pré-guia encontrada')).toBeInTheDocument();
  });

  it('erro mostra "Tentar novamente" e recarrega', async () => {
    const api = criarApi();
    api.listar.mockRejectedValueOnce(new Error('falhou'));
    render(<FilaPreGuiasPage api={api} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar a fila de pré-guias.');
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByText('0412')).toBeInTheDocument();
    expect(api.listar).toHaveBeenCalledTimes(2);
  });
});
