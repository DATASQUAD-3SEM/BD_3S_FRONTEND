import { describe, it, expect, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Routes, Route, useParams } from 'react-router-dom';
import MinhasPreGuiasRota from './MinhasPreGuiasRota';

/**
 * Testes da ligacao entre Minhas pre-guias e a tela de correcao (T9-FE).
 */

// A rota usa o cliente real por padrão; nos testes ele é trocado pelo mock da lista.
vi.mock('./api', async () => {
  const mock = await import('./api.mock');
  return { minhasPreGuiasApi: mock.apiMock };
});

function Correcao() {
  const { id } = useParams();
  return <p>Correção da pré-guia {id}</p>;
}

function renderizar(state?: { mensagem: string }) {
  render(
    <MemoryRouter initialEntries={[{ pathname: '/pre-guias', state }]}>
      <Routes>
        <Route path="/pre-guias" element={<MinhasPreGuiasRota />} />
        <Route path="/pre-guias/:id/corrigir" element={<Correcao />} />
      </Routes>
    </MemoryRouter>,
  );
}

describe('MinhasPreGuiasRota (T9-FE · ligação com a correção)', () => {
  it('mostra a confirmação vinda do reenvio', async () => {
    renderizar({ mensagem: 'Pré-guia 0003 reenviada ao setor de Guias. Ela voltou para Pendente.' });
    expect(await screen.findByRole('status')).toHaveTextContent(/reenviada ao setor de Guias/);
  });

  it('"Visualizar e corrigir" abre a correção da pré-guia', async () => {
    renderizar();
    const cartao = await screen.findByLabelText('Pré-guia 0003');
    await userEvent.click(within(cartao).getByRole('button', { name: 'Visualizar e corrigir' }));
    expect(await screen.findByText('Correção da pré-guia 3')).toBeInTheDocument();
  });
});
