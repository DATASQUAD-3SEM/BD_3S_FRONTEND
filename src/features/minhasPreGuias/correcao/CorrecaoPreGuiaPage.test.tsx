import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import CorrecaoPreGuiaPage from './CorrecaoPreGuiaPage';
import { correcaoMock, ocsMock } from './correcaoApi.mock';
import { ApiError } from '../../../shared/api/http';
import type { CorrecaoApi } from './types';

/**
 * Testes da tela Visualizar e corrigir pre-guia (T9-FE): carregamento, redirecionamentos e reenvio.
 */

function criarApi(): CorrecaoApi {
  return {
    obterCorrecao: vi.fn().mockResolvedValue(correcaoMock),
    buscarEncaminhamento: vi.fn().mockResolvedValue(new Blob(['img'], { type: 'image/jpeg' })),
    buscarOcs: vi.fn().mockResolvedValue(ocsMock),
    reenviar: vi.fn().mockResolvedValue({ status: 'PENDENTE', dataReenvio: '2026-10-25T10:00:00' }),
  };
}

function renderizar(api: CorrecaoApi = criarApi()) {
  const onVoltar = vi.fn();
  const onNaoElegivel = vi.fn();
  const onReenviado = vi.fn();
  render(
    <CorrecaoPreGuiaPage
      id={3}
      api={api}
      onVoltar={onVoltar}
      onNaoElegivel={onNaoElegivel}
      onReenviado={onReenviado}
    />,
  );
  return { api, onVoltar, onNaoElegivel, onReenviado };
}

const titulo = () => screen.findByRole('heading', { level: 1, name: 'Pré-guia 0003' });
const botaoReenviar = () => screen.getByRole('button', { name: 'Reenviar ao setor de Guias' });
const escolherOcs = async (nome: RegExp) => userEvent.click(await screen.findByRole('radio', { name: nome }));

beforeEach(() => {
  URL.createObjectURL = vi.fn(() => 'blob:fake');
  URL.revokeObjectURL = vi.fn();
});

describe('T9-FE · Tela "Pré-guia {número}" em correção', () => {
  it('mostra título, badge Atenção, observação, dados e o encaminhamento enviado', async () => {
    const { api } = renderizar();
    await titulo();
    expect(screen.getByText('Atenção')).toHaveClass('badge-atencao');
    expect(screen.getByText(/A foto do encaminhamento está desfocada/)).toBeInTheDocument();
    expect(screen.getByText('Registrada em 07/10/2026')).toBeInTheDocument();
    expect(screen.getByText('João da Silva')).toBeInTheDocument();
    expect(screen.getByText('2841773')).toBeInTheDocument();
    expect(screen.getByText('Foto enviada em 07/10/2026 (a que o setor marcou como ilegível)')).toBeInTheDocument();
    expect(await screen.findByRole('img', { name: 'Encaminhamento: encaminhamento-0003.jpg' })).toBeInTheDocument();
    expect(api.buscarEncaminhamento).toHaveBeenCalledWith(3);
  });

  it('marca a OCS atual com "(atual)" e a deixa selecionada', async () => {
    renderizar();
    await titulo();
    const atual = await screen.findByRole('radio', { name: /Policlínica Militar/ });
    expect(atual).toBeChecked();
    expect(screen.getByText('(atual)')).toBeInTheDocument();
  });

  it('Reenviar começa desabilitado e habilita ao trocar a OCS', async () => {
    renderizar();
    await titulo();
    expect(botaoReenviar()).toBeDisabled();
    await escolherOcs(/Clínica Santa Maria/);
    expect(botaoReenviar()).toBeEnabled();
  });

  it('reenvia só com a troca de OCS e avisa a lista', async () => {
    const { api, onReenviado } = renderizar();
    await titulo();
    await escolherOcs(/Clínica Santa Maria/);
    await userEvent.click(botaoReenviar());
    await waitFor(() => expect(onReenviado).toHaveBeenCalledTimes(1));
    expect(api.reenviar).toHaveBeenCalledWith(3, { ocsId: 2 });
    expect(onReenviado.mock.calls[0][0]).toMatch(/Pré-guia 0003 reenviada ao setor de Guias/);
  });

  it('reenvia só com o novo arquivo, sem mandar OCS', async () => {
    const { api, onReenviado } = renderizar();
    await titulo();
    const arquivo = new File(['x'], 'novo.jpg', { type: 'image/jpeg' });
    fireEvent.change(screen.getByLabelText('Escolher arquivo do novo encaminhamento'), {
      target: { files: [arquivo] },
    });
    expect(await screen.findByText('Selecionado · novo.jpg')).toBeInTheDocument();
    expect(botaoReenviar()).toBeEnabled();
    await userEvent.click(botaoReenviar());
    await waitFor(() => expect(onReenviado).toHaveBeenCalledTimes(1));
    expect(api.reenviar).toHaveBeenCalledWith(3, { arquivo });
  });

  it('duplo clique com a requisição em andamento envia uma única vez', async () => {
    const api = criarApi();
    let concluir!: () => void;
    // a resposta só chega quando o teste mandar: simula a rede lenta
    api.reenviar = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) => {
          concluir = () => resolve({ status: 'PENDENTE', dataReenvio: '2026-10-25T10:00:00' });
        }),
    );
    const { onReenviado } = renderizar(api);
    await titulo();
    await escolherOcs(/Clínica Santa Maria/);
    await userEvent.dblClick(botaoReenviar());
    expect(api.reenviar).toHaveBeenCalledTimes(1);
    expect(screen.getByRole('button', { name: 'Reenviando…' })).toBeDisabled();
    concluir();
    await waitFor(() => expect(onReenviado).toHaveBeenCalledTimes(1));
    expect(api.reenviar).toHaveBeenCalledTimes(1);
  });

  it('409 no reenvio avisa que a pré-guia já foi alterada e não sai da tela', async () => {
    const api = criarApi();
    api.reenviar = vi.fn().mockRejectedValue(new ApiError(409, 'Conflito'));
    const { onReenviado } = renderizar(api);
    await titulo();
    await escolherOcs(/Clínica Santa Maria/);
    await userEvent.click(botaoReenviar());
    expect(await screen.findByRole('alert')).toHaveTextContent(/já foi alterada/);
    expect(onReenviado).not.toHaveBeenCalled();
    expect(botaoReenviar()).toBeEnabled();
  });

  it('403 ao abrir (pré-guia criada por médico) volta para a lista', async () => {
    const api = criarApi();
    api.obterCorrecao = vi.fn().mockRejectedValue(new ApiError(403, 'Proibido'));
    const { onNaoElegivel } = renderizar(api);
    await waitFor(() => expect(onNaoElegivel).toHaveBeenCalledTimes(1));
  });

  it('409 ao abrir (não está em Atenção) volta para a lista', async () => {
    const api = criarApi();
    api.obterCorrecao = vi.fn().mockRejectedValue(new ApiError(409, 'Conflito'));
    const { onNaoElegivel } = renderizar(api);
    await waitFor(() => expect(onNaoElegivel).toHaveBeenCalledTimes(1));
  });

  it('404 mostra "Pré-guia não encontrada" com volta para a lista', async () => {
    const api = criarApi();
    api.obterCorrecao = vi.fn().mockRejectedValue(new ApiError(404, 'Não encontrada'));
    const { onVoltar, onNaoElegivel } = renderizar(api);
    expect(await screen.findByRole('heading', { name: 'Pré-guia não encontrada' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Voltar para Minhas pré-guias' }));
    expect(onVoltar).toHaveBeenCalledTimes(1);
    expect(onNaoElegivel).not.toHaveBeenCalled();
  });

  it('erro ao carregar mostra "Tentar novamente" e recarrega', async () => {
    const api = criarApi();
    api.obterCorrecao = vi.fn().mockRejectedValueOnce(new Error('falhou')).mockResolvedValue(correcaoMock);
    renderizar(api);
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível carregar esta pré-guia.');
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    await titulo();
    expect(api.obterCorrecao).toHaveBeenCalledTimes(2);
  });

  it('Cancelar sem alterações volta direto', async () => {
    const { onVoltar } = renderizar();
    await titulo();
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(onVoltar).toHaveBeenCalledTimes(1);
  });

  it('Cancelar com alterações pede confirmação antes de descartar', async () => {
    const { onVoltar } = renderizar();
    await titulo();
    await escolherOcs(/Clínica Santa Maria/);
    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    expect(screen.getByText(/Descartar as alterações\?/)).toBeInTheDocument();
    expect(onVoltar).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole('button', { name: 'Continuar editando' }));
    expect(screen.queryByText(/Descartar as alterações\?/)).not.toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar' }));
    await userEvent.click(screen.getByRole('button', { name: 'Descartar e voltar' }));
    expect(onVoltar).toHaveBeenCalledTimes(1);
  });
});
