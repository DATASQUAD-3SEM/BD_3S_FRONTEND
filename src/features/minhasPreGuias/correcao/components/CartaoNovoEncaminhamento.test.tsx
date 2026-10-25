import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom/vitest';
import CartaoNovoEncaminhamento, { validarEncaminhamento } from './CartaoNovoEncaminhamento';

const MB = 1024 * 1024;

function arquivoComTamanho(nome: string, tamanho: number): File {
  const arquivo = new File(['x'], nome, { type: 'application/octet-stream' });
  Object.defineProperty(arquivo, 'size', { value: tamanho });
  return arquivo;
}

describe('validarEncaminhamento', () => {
  it('aceita PDF, JPG e PNG (sem distinguir maiúsculas)', () => {
    expect(validarEncaminhamento(new File(['x'], 'a.PDF'))).toBeNull();
    expect(validarEncaminhamento(new File(['x'], 'b.jpg'))).toBeNull();
    expect(validarEncaminhamento(new File(['x'], 'c.PNG'))).toBeNull();
  });

  it('recusa outros formatos', () => {
    expect(validarEncaminhamento(new File(['x'], 'd.gif'))).toBe('Formato inválido. Envie PDF, JPG ou PNG.');
    expect(validarEncaminhamento(new File(['x'], 'sem-extensao'))).toBe('Formato inválido. Envie PDF, JPG ou PNG.');
  });

  it('recusa arquivo acima de 10 MB', () => {
    expect(validarEncaminhamento(arquivoComTamanho('grande.pdf', 11 * MB))).toBe(
      'Arquivo maior que o limite de 10 MB.',
    );
    expect(validarEncaminhamento(arquivoComTamanho('limite.pdf', 10 * MB))).toBeNull();
  });
});

describe('CartaoNovoEncaminhamento', () => {
  it('mostra o erro de formato e não entrega o arquivo', () => {
    const onChange = vi.fn();
    render(<CartaoNovoEncaminhamento arquivo={null} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Escolher arquivo do novo encaminhamento'), {
      target: { files: [new File(['x'], 'ruim.gif', { type: 'image/gif' })] },
    });
    expect(screen.getByRole('alert')).toHaveTextContent('Formato inválido. Envie PDF, JPG ou PNG.');
    expect(onChange).not.toHaveBeenCalled();
  });

  it('entrega um PDF válido ao componente pai', () => {
    const onChange = vi.fn();
    render(<CartaoNovoEncaminhamento arquivo={null} onChange={onChange} />);
    const pdf = new File(['x'], 'encaminhamento.pdf', { type: 'application/pdf' });
    fireEvent.change(screen.getByLabelText('Escolher arquivo do novo encaminhamento'), {
      target: { files: [pdf] },
    });
    expect(onChange).toHaveBeenCalledWith(pdf);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('com arquivo escolhido mostra "Selecionado · nome" e o botão Trocar', async () => {
    const onChange = vi.fn();
    const pdf = new File(['x'], 'encaminhamento.pdf', { type: 'application/pdf' });
    render(<CartaoNovoEncaminhamento arquivo={pdf} onChange={onChange} />);
    expect(screen.getByText('Selecionado · encaminhamento.pdf')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Trocar' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Usar câmera' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Trocar' }));
    expect(onChange).not.toHaveBeenCalled();
  });
});
