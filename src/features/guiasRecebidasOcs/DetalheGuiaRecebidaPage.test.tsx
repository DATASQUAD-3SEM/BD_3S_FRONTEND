import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import DetalheGuiaRecebidaPage from './DetalheGuiaRecebidaPage';
import { guiasRecebidasApi } from './api';
import { guiasFinalizadasApi } from '../espelhoOcs/api';
import type { GuiaRecebidaDetalhe } from './types';
import { ApiError } from '../../shared/api/http';
import { formatarPrecCp } from '../../shared/utils/formatadores';

/** Testes do modelo digitalizado da guia recebida pela OCS (T19-FE-2). */

vi.mock('./api', () => ({
  guiasRecebidasApi: { listar: vi.fn(), buscarDetalhe: vi.fn(), solicitarAssinatura: vi.fn() },
}));

// O visualizador de PDF e o mesmo da OCS (espelhoOcs), que le GET /ocs/guias/{id}/pdf
vi.mock('../espelhoOcs/api', () => ({
  guiasFinalizadasApi: { obterPdf: vi.fn() },
}));

// O jsdom nao implementa URLs de objeto (blob)
URL.createObjectURL = vi.fn(() => 'blob:teste');
URL.revokeObjectURL = vi.fn();

const guia: GuiaRecebidaDetalhe = {
  id: 7,
  numero: '202610703',
  validadeAte: '2099-12-31',
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
    vi.mocked(guiasRecebidasApi.solicitarAssinatura).mockReset();
  });

  it('mostra os dados lidos do PDF, com a validade e sem a UG', async () => {
    vi.mocked(guiasRecebidasApi.buscarDetalhe).mockResolvedValue(guia);
    renderizar();

    expect(await screen.findByRole('heading', { name: 'Guia 202610703' })).toBeInTheDocument();
    const dados = screen.getByRole('region', { name: 'Dados da guia (lidos do PDF)' });
    expect(within(dados).getByText('202610703')).toBeInTheDocument();
    expect(within(dados).getByText('31/12/2099')).toBeInTheDocument();
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

  describe('requerer assinatura, uma sessão por vez (T19-FE-3)', () => {
    const comDuasDisponiveis: GuiaRecebidaDetalhe = {
      ...guia,
      procedimentos: [{ codDgp: '40301630', descricao: 'Glicose', quantidade: 2 }],
      sessoes: [
        { id: 10, procedimento: '40301630', numero: 1, status: 'DISPONIVEL', dataSolicitacao: null, dataAssinatura: null },
        { id: 11, procedimento: '40301630', numero: 2, status: 'DISPONIVEL', dataSolicitacao: null, dataAssinatura: null },
      ],
    };

    const vencida: GuiaRecebidaDetalhe = { ...guia, validadeAte: '2020-01-01' };

    it('selecionar uma sessão disponível habilita Requerer; clicar de novo desmarca', async () => {
      const usuario = userEvent.setup();
      vi.mocked(guiasRecebidasApi.buscarDetalhe).mockResolvedValue(guia);
      renderizar();

      const requerer = await screen.findByRole('button', { name: 'Requerer assinatura' });
      expect(requerer).toBeDisabled();

      const casela = screen.getByRole('button', { name: 'Sessão 3: Disponível' });
      await usuario.click(casela);
      expect(casela).toHaveAttribute('aria-pressed', 'true');
      expect(requerer).toBeEnabled();

      await usuario.click(casela);
      expect(casela).toHaveAttribute('aria-pressed', 'false');
      expect(requerer).toBeDisabled();
    });

    it('só uma sessão fica selecionada por vez', async () => {
      const usuario = userEvent.setup();
      vi.mocked(guiasRecebidasApi.buscarDetalhe).mockResolvedValue(comDuasDisponiveis);
      renderizar();

      const primeira = await screen.findByRole('button', { name: 'Sessão 1: Disponível' });
      const segunda = screen.getByRole('button', { name: 'Sessão 2: Disponível' });
      await usuario.click(primeira);
      await usuario.click(segunda);

      expect(segunda).toHaveAttribute('aria-pressed', 'true');
      expect(primeira).toHaveAttribute('aria-pressed', 'false');
    });

    it('requerer muda a sessão para Solicitada, limpa a seleção e mostra a mensagem', async () => {
      const usuario = userEvent.setup();
      vi.mocked(guiasRecebidasApi.buscarDetalhe).mockResolvedValue(guia);
      vi.mocked(guiasRecebidasApi.solicitarAssinatura).mockResolvedValue({
        ...guia,
        sessoes: guia.sessoes.map((s) => (s.id === 3 ? { ...s, status: 'SOLICITADA' as const } : s)),
      });
      renderizar();

      await usuario.click(await screen.findByRole('button', { name: 'Sessão 3: Disponível' }));
      await usuario.click(screen.getByRole('button', { name: 'Requerer assinatura' }));

      expect(guiasRecebidasApi.solicitarAssinatura).toHaveBeenCalledWith(7, 3);
      expect(
        await screen.findByText(
          'Assinatura requerida para a sessão 3 de Hemograma completo. O beneficiário assina em Minhas guias.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByLabelText('Sessão 3: Solicitada')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Requerer assinatura' })).toBeDisabled();
    });

    it('sessão que não está disponível não vira botão de seleção', async () => {
      vi.mocked(guiasRecebidasApi.buscarDetalhe).mockResolvedValue(guia);
      renderizar();
      await screen.findByRole('button', { name: 'Sessão 3: Disponível' });

      expect(screen.getByLabelText('Sessão 1: Assinada').tagName).toBe('LI');
      expect(screen.getByLabelText('Sessão 2: Solicitada').tagName).toBe('LI');
      expect(screen.getByLabelText('Sessão 4: Sem sessão cadastrada').tagName).toBe('LI');
    });

    it('guia vencida mostra o banner, não permite seleção e desabilita Requerer', async () => {
      vi.mocked(guiasRecebidasApi.buscarDetalhe).mockResolvedValue(vencida);
      renderizar();

      expect(
        await screen.findByText('Guia vencida em 01/01/2020. Não aceita novas solicitações de sessão.'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: 'Sessão 3: Disponível' })).not.toBeInTheDocument();
      expect(screen.getByLabelText('Sessão 3: Disponível').tagName).toBe('LI');
      expect(screen.getByRole('button', { name: 'Requerer assinatura' })).toBeDisabled();
    });

    it('409 mostra o aviso, desmarca a seleção e recarrega a guia', async () => {
      const usuario = userEvent.setup();
      vi.mocked(guiasRecebidasApi.buscarDetalhe).mockResolvedValue(guia);
      vi.mocked(guiasRecebidasApi.solicitarAssinatura).mockRejectedValue(new ApiError(409, 'conflito'));
      renderizar();

      await usuario.click(await screen.findByRole('button', { name: 'Sessão 3: Disponível' }));
      await usuario.click(screen.getByRole('button', { name: 'Requerer assinatura' }));

      expect(
        await screen.findByText(
          'Esta sessão não pode ser requerida agora: a guia pode estar vencida ou a sessão já foi solicitada.',
        ),
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Requerer assinatura' })).toBeDisabled();
      expect(guiasRecebidasApi.buscarDetalhe).toHaveBeenCalledTimes(2);
    });

    it('403 (guia de outra OCS) mostra a mensagem de guia que não é da OCS', async () => {
      const usuario = userEvent.setup();
      vi.mocked(guiasRecebidasApi.buscarDetalhe).mockResolvedValue(guia);
      vi.mocked(guiasRecebidasApi.solicitarAssinatura).mockRejectedValue(new ApiError(403, 'negado'));
      renderizar();

      await usuario.click(await screen.findByRole('button', { name: 'Sessão 3: Disponível' }));
      await usuario.click(screen.getByRole('button', { name: 'Requerer assinatura' }));

      expect(await screen.findByText('Esta guia não é da sua OCS.')).toBeInTheDocument();
    });
  });

  describe('ver a guia em PDF (T19-FE-4)', () => {
    const pdf = () => new Blob(['%PDF-1.4'], { type: 'application/pdf' });

    it('o botão Ver guia (PDF) abre o visualizador e o mesmo botão fecha', async () => {
      const usuario = userEvent.setup();
      vi.mocked(guiasRecebidasApi.buscarDetalhe).mockResolvedValue(guia);
      vi.mocked(guiasFinalizadasApi.obterPdf).mockResolvedValue(pdf());
      renderizar();

      const botao = await screen.findByRole('button', { name: 'Ver guia (PDF)' });
      expect(botao).toHaveAttribute('aria-expanded', 'false');

      await usuario.click(botao);
      expect(guiasFinalizadasApi.obterPdf).toHaveBeenCalledWith(7);
      expect(await screen.findByText('Visualização somente leitura')).toBeInTheDocument();
      expect(screen.getByLabelText('PDF da guia 202610703')).toBeInTheDocument();
      expect(botao).toHaveAttribute('aria-expanded', 'true');

      await usuario.click(botao);
      expect(screen.queryByText('Visualização somente leitura')).not.toBeInTheDocument();
      expect(botao).toHaveAttribute('aria-expanded', 'false');
    });

    it('enquanto o PDF carrega, mostra "Carregando guia…"', async () => {
      const usuario = userEvent.setup();
      let liberar: (arquivo: Blob) => void = () => {};
      vi.mocked(guiasRecebidasApi.buscarDetalhe).mockResolvedValue(guia);
      vi.mocked(guiasFinalizadasApi.obterPdf).mockImplementation(
        () => new Promise<Blob>((resolve) => (liberar = resolve)),
      );
      renderizar();

      await usuario.click(await screen.findByRole('button', { name: 'Ver guia (PDF)' }));
      expect(await screen.findByText('Carregando guia…')).toBeInTheDocument();
      liberar(pdf());
      expect(await screen.findByText('Visualização somente leitura')).toBeInTheDocument();
    });

    it('erro ao carregar o PDF mostra "Não foi possível carregar a guia."', async () => {
      const usuario = userEvent.setup();
      vi.mocked(guiasRecebidasApi.buscarDetalhe).mockResolvedValue(guia);
      vi.mocked(guiasFinalizadasApi.obterPdf).mockRejectedValue(new Error('falhou'));
      renderizar();

      await usuario.click(await screen.findByRole('button', { name: 'Ver guia (PDF)' }));
      expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar a guia.');
    });
  });
});
