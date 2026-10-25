import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import CartaoOcs from './CartaoOcs';
import { ocsMock } from '../correcaoApi.mock';

describe('CartaoOcs (T9-FE · correção)', () => {
  it('marca a OCS atual com "(atual)" e busca só depois de 300 ms sem digitar', async () => {
    const buscar = vi.fn().mockResolvedValue(ocsMock);
    render(<CartaoOcs ocsAtualId={1} valor={1} onChange={vi.fn()} buscar={buscar} />);

    await screen.findByRole('radio', { name: /Policlínica Militar/ });
    expect(screen.getByText('(atual)')).toBeInTheDocument();

    await userEvent.type(screen.getByLabelText('Buscar OCS'), 'lab');
    await waitFor(() => expect(buscar).toHaveBeenLastCalledWith('lab'));
    // digitação rápida não dispara uma busca por tecla
    expect(buscar).not.toHaveBeenCalledWith('l');
    expect(buscar).not.toHaveBeenCalledWith('la');
  });

  it('informa quando a busca não acha nenhuma OCS', async () => {
    const buscar = vi.fn().mockResolvedValue([]);
    render(<CartaoOcs ocsAtualId={1} valor={1} onChange={vi.fn()} buscar={buscar} />);
    expect(await screen.findByText('Nenhuma OCS encontrada.')).toBeInTheDocument();
  });

  it('avisa o erro da busca e permite tentar de novo', async () => {
    const buscar = vi.fn().mockRejectedValueOnce(new Error('x')).mockResolvedValue(ocsMock);
    render(<CartaoOcs ocsAtualId={1} valor={1} onChange={vi.fn()} buscar={buscar} />);
    expect(await screen.findByRole('alert')).toHaveTextContent('Não foi possível buscar as OCS.');
    await userEvent.click(screen.getByRole('button', { name: 'Tentar novamente' }));
    expect(await screen.findByRole('radio', { name: /Policlínica Militar/ })).toBeInTheDocument();
  });
});
