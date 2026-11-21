import type { PacienteDaLista } from './paciente';

/** Item de Minhas pre-guias ou Minhas guias que tem paciente (opcional nos dois contratos). */
export interface ComPaciente {
  paciente?: PacienteDaLista;
}

export const FILTRO_TODOS = 'todos';
export const FILTRO_TITULAR = 'titular';

/** Há algum dependente na lista? Só então a frase e o filtro por paciente aparecem (T30-FE2). */
export function temDependente(itens: ComPaciente[]): boolean {
  return itens.some((i) => i.paciente && i.paciente.dependenteId !== null);
}

/**
 * Frase do topo da lista. Para o titular: as dele e as dos menores que acompanha. Para o responsavel externo (sem
 * nenhum item proprio): so as dos menores. Retorna nulo quando nao ha dependente.
 */
export function fraseDaLista(itens: ComPaciente[], substantivo: 'pré-guias' | 'guias'): string | null {
  if (!temDependente(itens)) return null;
  const temTitular = itens.some((i) => i.paciente && i.paciente.dependenteId === null);
  if (temTitular) {
    return `Aqui aparecem as suas ${substantivo} e as dos dependentes menores de idade que você acompanha como responsável legal.`;
  }
  return `Aqui aparecem as ${substantivo} dos dependentes menores de idade que você acompanha como responsável legal.`;
}

/** Itens da lista conforme o filtro "Paciente" (todos, titular ou um dependente). */
export function filtrarPorPaciente<T extends ComPaciente>(itens: T[], filtro: string): T[] {
  if (filtro === FILTRO_TODOS) return itens;
  if (filtro === FILTRO_TITULAR) return itens.filter((i) => i.paciente?.dependenteId === null);
  return itens.filter((i) => String(i.paciente?.dependenteId) === filtro);
}

interface Props {
  itens: ComPaciente[];
  value: string;
  onChange: (valor: string) => void;
}

/** Filtro "Paciente" feito na tela: Todos, Você e um item por menor/dependente. Só aparece com dependente. */
export default function FiltroPaciente({ itens, value, onChange }: Props) {
  if (!temDependente(itens)) return null;

  const temTitular = itens.some((i) => i.paciente && i.paciente.dependenteId === null);
  const dependentes = new Map<number, string>();
  itens.forEach((i) => {
    if (i.paciente && i.paciente.dependenteId !== null) {
      dependentes.set(i.paciente.dependenteId, i.paciente.nome);
    }
  });

  return (
    <label>
      Paciente{' '}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        <option value={FILTRO_TODOS}>Todos</option>
        {temTitular && <option value={FILTRO_TITULAR}>Você</option>}
        {[...dependentes.entries()].map(([id, nome]) => (
          <option key={id} value={String(id)}>
            {nome}
          </option>
        ))}
      </select>
    </label>
  );
}
