import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DetalheGuiaRecebidaPage from './DetalheGuiaRecebidaPage';
import { guiasRecebidasApi } from './api';
import type { GuiaRecebidaDetalhe } from './types';
import { ApiError } from '../../shared/api/http';
import { formatarPrecCp } from '../../shared/utils/formatadores';

/** Testes do modelo digitalizado da guia recebida pela OCS (T19-FE-2). */

vi.mock('./api', () => ({
  guiasRecebidasApi: { listar: vi.fn(), buscarDetalhe: vi.fn() },
}));

const guia: GuiaRecebidaDetalhe = {
  id: 7,
  numero: '202610703',
  validadeAte: '2026-12-24',
  beneficiario: { nome: 'Antonio Carlos Ferreira', precCp: '45872213300' },
  procedimentos: [
    { codDgp: '40304361', descricao: 'Hemograma completo', quantidade: 4 },
    { codDgp: '40301630', descricao: 'Glicose', quantidade: 1 },
  ],
  sessoes: [
    { id: 1, procedimento: '40304361', numero: 1, status: 'ASSINADA', dataSolicitacao: null, dataAssinatura: null },
    { id: 2, procedimento: '40304361', numero: 2, status: 'SOLICITADA', dataSolicitacao: null, dataAssinatura: null },
    { id: 3, procedimento: '40304361', numero: 3, status: 'DISPONIVEL', dataSolicitacao: null, dataAssinatura: null },
    { id: 4, procedimento: '40301630', numero: 1, status: 'EXPIRADA', dataSolicitacao: null, dataAssinatura: null },
  ],
};

const renderizar = (caminho = '/ocs/guias-recebidas/7') =>
  render(
    <MemoryRouter initialEntries={[caminho]}>
      <Routes>
        <Route path="/ocs/guias-recebidas/:id" element={<DetalheGuiaRecebidaPage />} />
      </Routes>
    </MemoryRouter>,
  );

describe('T19-FE-2 · Modelo digitalizado da guia', () => {
  beforeEach(() => {
    vi.mocked(guiasRecebidasApi.buscarDetalhe).mockReset();
  });

  it('mostra os dados lidos do PDF, com a validade e sem a UG', async () => {
    vi.mocked(guiasRecebidasApi.buscarDetalhe).mockResolvedValue(guia);
    renderizar();

    expect(await screen.findByRole('heading', { name: 'Guia 202610703' })).toBeInTheDocument();
    const dados = screen.getByRole('region', { name: 'Dados da guia (lidos do PDF)' });
    expect(within(dados).getByText('202610703')).toBeInTheDocument();
    expect(within(dados).getByText('24/12/2026')).toBeInTheDocument();
    expect(within(dados).getByText('Antonio Carlos Ferreira')).toBeInTheDocument();
    expect(within(dados).getByText(formatarPrecCp('45872213300'))).toBeInTheDocument();
    expect(screen.queryByText(/Unidade Gestora|\bUG\b/)).not.toBeInTheDocument();
  });

  it('lista os procedimentos autorizados com código, descrição e quantidade', async () => {
    vi.mocked(guiasRecebidasApi.buscarDetalhe).mockResolvedValue(guia);
    renderizar();

    const tabela = await screen.findByRole('table');
    const linha = within(tabela).getByRole('row', { name: /Hemograma completo/ });
    expect(within(linha).getByText('40304361')).toBeInTheDocument();
    expect(within(linha).getByText('4')).toBeInTheDocument();
  });

  it('a grade tem uma casela por unidade autorizada, com a cor e o rótulo de cada situação', async () => {
    vi.mocked(guiasRecebidasApi.buscarDetalhe).mockResolvedValue(guia);
    renderizar();
    await screen.findByRole('heading', { name: 'Guia 202610703' });

    const sessoes = screen.getByRole('list', { name: 'Sessões de Hemograma completo' });
    const casas = within(sessoes).getAllByRole('listitem');
    expect(casas).toHaveLength(4);
    expect(within(sessoes).getByLabelText('Sessão 1: Assinada')).toHaveClass('gr-sessao--assinada');
    expect(within(sessoes).getByLabelText('Sessão 2: Solicitada')).toHaveClass('gr-sessao--solicitada');
    expect(within(sessoes).getByLabelText('Sessão 3: Disponível')).toHaveClass('gr-sessao--disponivel');
    // quantidade 4, mas so 3 sessoes no retorno: a 4a aparece sem sessao, nao como disponivel
    expect(within(sessoes).getByLabelText('Sessão 4: Sem sessão cadastrada')).toHaveClass('gr-sessao--ausente');
  });

  it('sessão expirada aparece com a cor cinza riscada', async () => {
    vi.mocked(guiasRecebidasApi.buscarDetalhe).mockResolvedValue(guia);
    renderizar();
    await screen.findByRole('heading', { name: 'Guia 202610703' });

    const glicose = screen.getByRole('list', { name: 'Sessões de Glicose' });
    expect(within(glicose).getByLabelText('Sessão 1: Expirada')).toHaveClass('gr-sessao--expirada');
  });

  it('mostra a legenda com as quatro situações', async () => {
    vi.mocked(guiasRecebidasApi.buscarDetalhe).mockResolvedValue(guia);
    renderizar();
    await screen.findByRole('heading', { name: 'Guia 202610703' });

    const legenda = screen.getByRole('list', { name: 'Legenda das sessões' });
    for (const rotulo of ['Disponível', 'Solicitada', 'Assinada', 'Expirada']) {
      expect(within(legenda).getByText(rotulo)).toBeInTheDocument();
    }
  });

  it('o link "← Guias recebidas" volta para a lista', async () => {
    vi.mocked(guiasRecebidasApi.buscarDetalhe).mockResolvedValue(guia);
    renderizar();
    await screen.findByRole('heading', { name: 'Guia 202610703' });

    expect(screen.getByRole('link', { name: '← Guias recebidas' })).toHaveAttribute('href', '/ocs/guias-recebidas');
  });

  it('guia de outra OCS (404) mostra "Guia não encontrada."', async () => {
    vi.mocked(guiasRecebidasApi.buscarDetalhe).mockRejectedValue(new ApiError(404, 'Guia não encontrada'));
    renderizar();

    expect(await screen.findByText('Guia não encontrada.')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: /Guia / })).not.toBeInTheDocument();
  });

  it('id inválido na rota mostra "Guia não encontrada." sem chamar a API', async () => {
    renderizar('/ocs/guias-recebidas/abc');

    expect(await screen.findByText('Guia não encontrada.')).toBeInTheDocument();
    expect(guiasRecebidasApi.buscarDetalhe).not.toHaveBeenCalled();
  });

  it('erro de carregamento mostra o aviso e "Tentar novamente" recarrega a guia', async () => {
    const usuario = userEvent.setup();
    vi.mocked(guiasRecebidasApi.buscarDetalhe)
      .mockRejectedValueOnce(new Error('falhou'))
      .mockResolvedValueOnce(guia);
    renderizar();

    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar a guia.');
    await usuario.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('heading', { name: 'Guia 202610703' })).toBeInTheDocument();
  });

  it('enquanto carrega, mostra o esqueleto', async () => {
    let liberar: (dados: GuiaRecebidaDetalhe) => void = () => {};
    vi.mocked(guiasRecebidasApi.buscarDetalhe).mockImplementation(
      () => new Promise<GuiaRecebidaDetalhe>((resolve) => (liberar = resolve)),
    );
    renderizar();

    expect(screen.getByLabelText('Carregando guia')).toBeInTheDocument();
    liberar(guia);
    expect(await screen.findByRole('heading', { name: 'Guia 202610703' })).toBeInTheDocument();
  });
});
