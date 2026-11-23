import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import GuiasRecebidasPage from './GuiasRecebidasPage';
import { guiasRecebidasApi } from './api';
import type { GuiaRecebida } from './types';
import { formatarPrecCp } from '../../shared/utils/formatadores';

/** Testes da lista "Guias recebidas" da OCS (T19-FE-1). */

vi.mock('./api', () => ({
  guiasRecebidasApi: { listar: vi.fn() },
}));

const antonio: GuiaRecebida = {
  id: 1,
  numero: '202610703',
  beneficiario: { nome: 'Antonio Carlos Ferreira', precCp: '45872213300' },
  procedimentos: [{ codDgp: '40304361', descricao: 'Hemograma completo', quantidade: 2 }],
  dataEnvio: '2026-10-10T11:00:00',
  situacao: 'ENVIADA',
};

const marta: GuiaRecebida = {
  id: 2,
  numero: '202610811',
  beneficiario: { nome: 'Marta Souza Lima', precCp: '45810020001' },
  procedimentos: [{ codDgp: '40301630', descricao: 'Glicose', quantidade: 1 }],
  dataEnvio: '2026-10-12T09:30:00',
  situacao: 'EM_EXECUCAO',
};

const renderizar = () =>
  render(
    <MemoryRouter>
      <GuiasRecebidasPage />
    </MemoryRouter>,
  );

describe('T19-FE-1 · Guias recebidas', () => {
  beforeEach(() => {
    vi.mocked(guiasRecebidasApi.listar).mockReset();
  });

  it('mostra a tabela com as colunas e os dados de cada guia', async () => {
    vi.mocked(guiasRecebidasApi.listar).mockResolvedValue([antonio, marta]);
    renderizar();

    expect(await screen.findByRole('heading', { name: 'Guias recebidas' })).toBeInTheDocument();
    const tabela = screen.getByRole('table');
    for (const cabecalho of ['Guia', 'Beneficiário', 'Prec CP', 'Procedimento', 'Enviada em', 'Situação']) {
      expect(within(tabela).getByRole('columnheader', { name: cabecalho })).toBeInTheDocument();
    }

    const linhaAntonio = screen.getByRole('row', { name: /202610703/ });
    expect(within(linhaAntonio).getByText('Antonio Carlos Ferreira')).toBeInTheDocument();
    expect(within(linhaAntonio).getByText(formatarPrecCp('45872213300'))).toBeInTheDocument();
    expect(within(linhaAntonio).getByText('Hemograma completo')).toBeInTheDocument();
    expect(within(linhaAntonio).getByText('10/10/2026')).toBeInTheDocument();
    expect(within(linhaAntonio).getByText('Enviada')).toBeInTheDocument();
  });

  it('o botão Abrir leva ao modelo da guia certa', async () => {
    vi.mocked(guiasRecebidasApi.listar).mockResolvedValue([antonio, marta]);
    renderizar();

    const linha = await screen.findByRole('row', { name: /202610811/ });
    expect(within(linha).getByRole('link', { name: 'Abrir' })).toHaveAttribute('href', '/ocs/guias-recebidas/2');
  });

  it('mostra o esqueleto enquanto carrega', async () => {
    let liberar: (lista: GuiaRecebida[]) => void = () => {};
    vi.mocked(guiasRecebidasApi.listar).mockImplementation(
      () => new Promise<GuiaRecebida[]>((resolve) => (liberar = resolve)),
    );
    renderizar();

    expect(screen.getByLabelText('Carregando guias recebidas')).toBeInTheDocument();
    liberar([antonio]);
    expect(await screen.findByRole('table')).toBeInTheDocument();
  });

  it('sem guias, mostra "Nenhuma guia recebida."', async () => {
    vi.mocked(guiasRecebidasApi.listar).mockResolvedValue([]);
    renderizar();

    expect(await screen.findByText('Nenhuma guia recebida.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('erro ao carregar mostra o aviso e "Tentar novamente" recarrega a lista', async () => {
    const usuario = userEvent.setup();
    vi.mocked(guiasRecebidasApi.listar)
      .mockRejectedValueOnce(new Error('falhou'))
      .mockResolvedValueOnce([antonio]);
    renderizar();

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar as guias recebidas.');
    await usuario.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('row', { name: /202610703/ })).toBeInTheDocument();
  });

  it('busca por nome do beneficiário', async () => {
    const usuario = userEvent.setup();
    vi.mocked(guiasRecebidasApi.listar).mockResolvedValue([antonio, marta]);
    renderizar();
    await screen.findByRole('table');

    await usuario.type(screen.getByLabelText('Buscar guia'), 'marta');
    expect(screen.getByRole('row', { name: /202610811/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /202610703/ })).not.toBeInTheDocument();
  });

  it('busca pelo número da guia', async () => {
    const usuario = userEvent.setup();
    vi.mocked(guiasRecebidasApi.listar).mockResolvedValue([antonio, marta]);
    renderizar();
    await screen.findByRole('table');

    await usuario.type(screen.getByLabelText('Buscar guia'), '202610703');
    expect(screen.getByRole('row', { name: /202610703/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /202610811/ })).not.toBeInTheDocument();
  });

  it('busca pelo Prec CP, mesmo digitado com traço', async () => {
    const usuario = userEvent.setup();
    vi.mocked(guiasRecebidasApi.listar).mockResolvedValue([antonio, marta]);
    renderizar();
    await screen.findByRole('table');

    await usuario.type(screen.getByLabelText('Buscar guia'), '458100-200');
    expect(screen.getByRole('row', { name: /202610811/ })).toBeInTheDocument();
    expect(screen.queryByRole('row', { name: /202610703/ })).not.toBeInTheDocument();
  });

  it('busca sem resultado mostra o aviso da busca', async () => {
    const usuario = userEvent.setup();
    vi.mocked(guiasRecebidasApi.listar).mockResolvedValue([antonio, marta]);
    renderizar();
    await screen.findByRole('table');

    await usuario.type(screen.getByLabelText('Buscar guia'), 'zzz');
    expect(screen.getByText('Nenhuma guia encontrada para a busca.')).toBeInTheDocument();
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });
});
